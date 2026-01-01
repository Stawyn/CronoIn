import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Switch,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import { cadastrarPonto, editarPonto } from '../../services/PontoService';
import { TimePickerModal } from 'react-native-paper-dates';
import { MaterialIcons } from '@expo/vector-icons';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from '../../components/GeoMap/GeoMap';

const STEP_TITLES = [
  'Informações Básicas',
  'Configuração Semanal',
  'Calendário de Aplicação',
  'Políticas e Regras',
  'Resumo e Confirmação'
];

const JOURNEY_TYPES = [
  { value: 'Semanal Fixa', label: 'Semanal Fixa' }
];

const WEEK_DAYS = [
  { key: 1, label: 'Segunda-feira', short: 'Seg' },
  { key: 2, label: 'Terça-feira', short: 'Ter' },
  { key: 3, label: 'Quarta-feira', short: 'Qua' },
  { key: 4, label: 'Quinta-feira', short: 'Qui' },
  { key: 5, label: 'Sexta-feira', short: 'Sex' },
  { key: 6, label: 'Sábado', short: 'Sáb' },
  { key: 0, label: 'Domingo', short: 'Dom' }
];

const SCHEDULE_DAY_TYPES = [
  { value: 'Normal', label: 'Normal', description: 'Dia útil com expediente completo', accent: '#21808d' },
  { value: 'Folga', label: 'Folga', description: 'Sem expediente programado', accent: '#2563eb' },
  { value: 'DSR', label: 'DSR', description: 'Descanso semanal remunerado', accent: '#7f2de2' },
  { value: 'Feriado', label: 'Feriado', description: 'Dia de feriado cadastrado', accent: '#c0152f' }
];

const CALENDAR_DAY_TYPES = [
  { value: 'work', label: 'Trabalho', color: '#21808d' },
  { value: 'off', label: 'Folga', color: '#2563eb' },
  { value: 'holiday', label: 'Feriado', color: '#c0152f' }
];


const INITIAL_ADVANCED = {
  toleranceIn: '05',
  toleranceOut: '05',
  closingTime: '00:00',
  partialAbsence: false
};

const INITIAL_COMPLIANCE = {
  requireFacial: false,
  requireGeo: false,
  lat: '',
  lng: '',
  radius: '100'
};

const DEFAULT_COORDINATE = {
  latitude: -23.55052,
  longitude: -46.633308
};

const DEFAULT_REGION = {
  ...DEFAULT_COORDINATE,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01
};

const parseCoordinate = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  const normalized = typeof value === 'string' ? value.replace(',', '.') : value;
  const numeric = Number.parseFloat(normalized);
  return Number.isFinite(numeric) ? numeric : null;
};

const buildInitialRegion = (pontoEditar) => {
  const lat = parseCoordinate(pontoEditar?.cad_ponto_gps_center_lat);
  const lng = parseCoordinate(pontoEditar?.cad_ponto_gps_center_lng);
  if (lat !== null && lng !== null) {
    return {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
    };
  }
  return DEFAULT_REGION;
};

const clampValue = (value, max) => {
  const numeric = Number.parseInt(value || '0', 10);
  if (Number.isNaN(numeric)) {
    return value || '';
  }
  const clamped = Math.min(numeric, max);
  return clamped.toString().padStart(value.length || 1, '0');
};

const formatTimeInput = (value) => {
  if (!value) {
    return '';
  }
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (!digits) {
    return '';
  }
  if (digits.length <= 2) {
    return clampValue(digits, 23);
  }
  const hoursRaw = digits.slice(0, 2);
  const minutesRaw = digits.slice(2);
  const hours = clampValue(hoursRaw, 23).padStart(2, '0');
  if (minutesRaw.length === 1) {
    return `${hours}:${minutesRaw}`;
  }
  const minutes = clampValue(minutesRaw, 59).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const isValidTime = (value) => /^\d{2}:\d{2}$/.test(value);

const addMinutes = (timeString, minutesToAdd) => {
  if (!isValidTime(timeString)) {
    return '';
  }
  const [hour, minute] = timeString.split(':').map(Number);
  const total = hour * 60 + minute + minutesToAdd;
  const normalized = ((total % (24 * 60)) + (24 * 60)) % (24 * 60);
  const h = Math.floor(normalized / 60).toString().padStart(2, '0');
  const m = (normalized % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

const minutesBetween = (start, end) => {
  if (!isValidTime(start) || !isValidTime(end)) {
    return 0;
  }
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  if (endMinutes < startMinutes) {
    return (24 * 60 - startMinutes) + endMinutes;
  }
  return endMinutes - startMinutes;
};

const normalizeTimeString = (value) => {
  if (!value && value !== 0) {
    return '';
  }
  const str = typeof value === 'string' ? value.trim() : `${value}`;
  if (!str) {
    return '';
  }
  const candidate = str.includes(':') ? str.slice(0, 5) : str;
  const formatted = formatTimeInput(candidate);
  return isValidTime(formatted) ? formatted : '';
};

const createEmptySchedule = () => {
  const base = {};
  WEEK_DAYS.forEach((day) => {
    base[day.key] = {
      enabled: day.key >= 1 && day.key <= 5,
      type: day.key >= 1 && day.key <= 5 ? 'Normal' : day.key === 0 ? 'DSR' : 'Folga',
      entry1: '',
      exit1: '',
      entry2: '',
      exit2: ''
    };
  });
  return base;
};

const getInitialScheduleFromPonto = (pontoEditar) => {
  const schedule = createEmptySchedule();
  if (!pontoEditar) {
    return schedule;
  }

  const start = normalizeTimeString(pontoEditar.cad_ponto_inicio);
  const end = normalizeTimeString(pontoEditar.cad_ponto_fim);
  const hasPause = Boolean(pontoEditar.cad_ponto_pausa);
  const pauseStart = normalizeTimeString(pontoEditar.cad_ponto_inicio_almoco);
  const pauseMinutes = pontoEditar.cad_ponto_tempo_pausa_min || 0;
  const includedDays = pontoEditar.cad_ponto_dias_semana
    ? pontoEditar.cad_ponto_dias_semana.split(',').map((d) => parseInt(d, 10))
    : [];
  const config = pontoEditar.config_semanal || {};

  WEEK_DAYS.forEach((day) => {
    const configInfo = config[day.key] || config[`${day.key}`] || {};
    const defaultEnabled = includedDays.includes(day.key) || (day.key >= 1 && day.key <= 5);
    const enabled = typeof configInfo.enabled === 'boolean' ? configInfo.enabled : defaultEnabled;
    const fallbackType = day.key === 0 ? 'DSR' : 'Folga';
    const type = configInfo.type || (enabled ? 'Normal' : fallbackType);

    const entry1Raw = configInfo.entry1 || (enabled && type === 'Normal' ? start : '');
    const exit1Raw = configInfo.exit1 || (hasPause && enabled && type === 'Normal' ? pauseStart : '');
    const entry2Fallback = hasPause && pauseStart && pauseMinutes > 0 ? addMinutes(pauseStart, pauseMinutes) : '';
    const entry2Raw = configInfo.entry2 || entry2Fallback;
    const exit2Raw = configInfo.exit2 || (enabled && type === 'Normal' ? end : '');

    const active = enabled && type === 'Normal';

    schedule[day.key] = {
      enabled,
      type,
      entry1: active ? normalizeTimeString(entry1Raw) : '',
      exit1: active ? normalizeTimeString(exit1Raw) : '',
      entry2: active ? normalizeTimeString(entry2Raw) : '',
      exit2: active ? normalizeTimeString(exit2Raw) : ''
    };
  });

  return schedule;
};

const CalendarDay = ({ day, onPress, isCurrentMonth, selection, dayType }) => {
  const baseStyle = [styles.calendarDay];
  if (!isCurrentMonth) {
    baseStyle.push(styles.calendarDayDisabled);
  }
  if (selection) {
    baseStyle.push({ backgroundColor: dayType?.color || '#21808d' });
  }
  return (
    <TouchableOpacity
      disabled={!day}
      onPress={() => day && isCurrentMonth && onPress(day)}
      style={baseStyle}
    >
      <Text style={[styles.calendarDayText, !isCurrentMonth && styles.calendarDayTextDisabled]}>{day ? day.getDate() : ''}</Text>
    </TouchableOpacity>
  );
};

export default function CadastroPonto({ navigation, route }) {
  const pontoEditar = route.params?.ponto;
  const isEditing = Boolean(pontoEditar?.cad_id);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isCompact = width < 768;

  const [basics, setBasics] = useState({
    name: pontoEditar?.cad_ponto_nome || '',
    code: pontoEditar?.cad_ponto_codigo || '',
    description: pontoEditar?.cad_ponto_descricao || '',
    type: pontoEditar?.cad_ponto_tipo || 'Semanal Fixa',
    dailyHours: normalizeTimeString(pontoEditar?.cad_ponto_carga_diaria) || '',
    weeklyHours: pontoEditar?.cad_ponto_carga_semanal || '',
    workdays: pontoEditar?.cad_ponto_dias_trabalho || ''
  });

  const [schedule, setSchedule] = useState(() => {
    const initial = getInitialScheduleFromPonto(pontoEditar);
    if (!initial[1].entry1) {
      initial[1].entry1 = '08:00';
      initial[1].exit2 = '17:48';
    }
    return initial;
  });
  const [selectedDayType, setSelectedDayType] = useState('work');
  const [selectedDates, setSelectedDates] = useState(() => {
    if (pontoEditar?.calendario_aplicacao?.length) {
      return pontoEditar.calendario_aplicacao.reduce((acc, item) => {
        if (item?.data && item?.tipo) {
          acc[item.data] = item.tipo;
        }
        return acc;
      }, {});
    }
    return {};
  });
  const today = new Date();
  const [calendarCursor, setCalendarCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const [advanced, setAdvanced] = useState(() => {
    const toleranceInValue =
      typeof pontoEditar?.cad_ponto_tolerancia_min === 'number'
        ? pontoEditar.cad_ponto_tolerancia_min
        : parseInt(INITIAL_ADVANCED.toleranceIn, 10);
    const toleranceOutValue =
      typeof pontoEditar?.cad_ponto_tolerancia_saida_min === 'number'
        ? pontoEditar.cad_ponto_tolerancia_saida_min
        : parseInt(INITIAL_ADVANCED.toleranceOut, 10);
    const partialAbsenceValue = pontoEditar?.cad_ponto_falta_parcial_auto;

    return {
      toleranceIn: (Number.isNaN(toleranceInValue) ? 0 : toleranceInValue).toString().padStart(2, '0'),
      toleranceOut: (Number.isNaN(toleranceOutValue) ? 0 : toleranceOutValue).toString().padStart(2, '0'),
      closingTime: normalizeTimeString(pontoEditar?.cad_ponto_fechamento_dia) || INITIAL_ADVANCED.closingTime,
      partialAbsence:
        partialAbsenceValue !== undefined && partialAbsenceValue !== null
          ? Boolean(partialAbsenceValue)
          : INITIAL_ADVANCED.partialAbsence
    };
  });

  const [compliance, setCompliance] = useState(() => ({
    requireFacial: Boolean(pontoEditar?.cad_ponto_facial_required),
    requireGeo: Boolean(pontoEditar?.cad_ponto_gps_enabled),
    lat:
      pontoEditar?.cad_ponto_gps_center_lat !== undefined && pontoEditar?.cad_ponto_gps_center_lat !== null
        ? String(pontoEditar.cad_ponto_gps_center_lat)
        : INITIAL_COMPLIANCE.lat,
    lng:
      pontoEditar?.cad_ponto_gps_center_lng !== undefined && pontoEditar?.cad_ponto_gps_center_lng !== null
        ? String(pontoEditar.cad_ponto_gps_center_lng)
        : INITIAL_COMPLIANCE.lng,
    radius:
      pontoEditar?.cad_ponto_gps_radius_m !== undefined && pontoEditar?.cad_ponto_gps_radius_m !== null
        ? String(pontoEditar.cad_ponto_gps_radius_m)
        : INITIAL_COMPLIANCE.radius
  }));
  const [mapRegion, setMapRegion] = useState(() => buildInitialRegion(pontoEditar));

  useEffect(() => {
    const lat = parseCoordinate(compliance.lat);
    const lng = parseCoordinate(compliance.lng);
    if (lat !== null && lng !== null) {
      setMapRegion((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    }
  }, [compliance.lat, compliance.lng]);

  const [typePickerDay, setTypePickerDay] = useState(null);
  const [copyModalVisible, setCopyModalVisible] = useState(false);
  const [copySource, setCopySource] = useState(1);
  const [copyTargets, setCopyTargets] = useState([]);
  const [timePickerState, setTimePickerState] = useState({
    visible: false,
    context: null,
    hours: 8,
    minutes: 0
  });

  const updateSchedule = (dayKey, field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: field === 'entry1' || field === 'exit1' || field === 'entry2' || field === 'exit2'
          ? formatTimeInput(value)
          : value
      }
    }));
  };

  const toggleDayEnabled = (dayKey) => {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        enabled: !prev[dayKey].enabled,
        type: !prev[dayKey].enabled ? 'Normal' : prev[dayKey].type
      }
    }));
  };

  const weeklyMinutes = useMemo(() => {
    return WEEK_DAYS.reduce((acc, day) => {
      const info = schedule[day.key];
      if (!info || !info.enabled || info.type !== 'Normal') {
        return acc;
      }
      let minutes = minutesBetween(info.entry1, info.exit1);
      if (info.entry2 && info.exit2) {
        minutes += minutesBetween(info.entry2, info.exit2);
      } else if (!info.entry2 && info.exit2) {
        minutes = minutesBetween(info.entry1, info.exit2);
      }
      return acc + minutes;
    }, 0);
  }, [schedule]);

  const weeklyHoursLabel = useMemo(() => {
    const hours = Math.floor(weeklyMinutes / 60);
    const mins = weeklyMinutes % 60;
    return `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`;
  }, [weeklyMinutes]);

  const buildConfigPayload = useCallback(() => {
    const ensureTime = (value) => (isValidTime(value) ? value : null);
    const payload = {};
    Object.entries(schedule).forEach(([key, info]) => {
      const numericKey = Number.parseInt(key, 10);
      const enabled = Boolean(info?.enabled);
      const fallbackType = Number.isNaN(numericKey) ? 'Folga' : numericKey === 0 ? 'DSR' : 'Folga';
      payload[key] = {
        enabled,
        type: info?.type || (enabled ? 'Normal' : fallbackType),
        entry1: ensureTime(info?.entry1),
        exit1: ensureTime(info?.exit1),
        entry2: ensureTime(info?.entry2),
        exit2: ensureTime(info?.exit2)
      };
    });
    return payload;
  }, [schedule]);

  const buildCalendarPayload = useCallback(() => (
    Object.entries(selectedDates)
      .filter(([, tipo]) => CALENDAR_DAY_TYPES.some((item) => item.value === tipo))
      .map(([data, tipo]) => ({ data, tipo }))
  ), [selectedDates]);

  const handleRepeatWeekdays = () => {
    const monday = schedule[1];
    if (!monday) {
      return;
    }
    setSchedule((prev) => {
      const next = { ...prev };
      [2, 3, 4, 5].forEach((key) => {
        next[key] = { ...next[key], ...monday };
      });
      return next;
    });
  };

  const openCopyModal = () => {
    setCopySource(1);
    setCopyTargets([]);
    setCopyModalVisible(true);
  };

  const applyCopy = () => {
    const base = schedule[copySource];
    if (!base) {
      setCopyModalVisible(false);
      return;
    }
    setSchedule((prev) => {
      const next = { ...prev };
      copyTargets.forEach((target) => {
        next[target] = { ...next[target], ...base };
      });
      return next;
    });
    setCopyModalVisible(false);
  };

  const openTimePicker = (context) => {
    const rawValue = typeof context?.value === 'string' ? context.value : '';
    const [hours, minutes] = isValidTime(rawValue)
      ? rawValue.split(':').map((part) => Number.parseInt(part, 10))
      : [8, 0];
    setTimePickerState({
      visible: true,
      context,
      hours,
      minutes
    });
  };

  const closeTimePicker = () => {
    setTimePickerState((prev) => ({ ...prev, visible: false }));
  };

  const handleTimeConfirm = ({ hours, minutes }) => {
    const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    if (timePickerState.context?.type === 'schedule') {
      updateSchedule(timePickerState.context.dayKey, timePickerState.context.field, formatted);
    } else if (timePickerState.context?.type === 'closingTime') {
      setAdvanced((prev) => ({ ...prev, closingTime: formatted }));
    }
    setTimePickerState((prev) => ({ ...prev, visible: false }));
  };

  const handleCalendarDayPress = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    setSelectedDates((prev) => {
      const next = { ...prev };
      if (next[dateKey] === selectedDayType) {
        delete next[dateKey];
      } else {
        next[dateKey] = selectedDayType;
      }
      return next;
    });
  };

  const moveCalendar = (direction) => {
    setCalendarCursor((prev) => {
      let year = prev.year;
      let month = prev.month + direction;
      if (month < 0) {
        month = 11;
        year -= 1;
      }
      if (month > 11) {
        month = 0;
        year += 1;
      }
      return { year, month };
    });
  };

  const selectedCount = Object.keys(selectedDates).length;

  const handleSelectWeekdays = () => {
    const { year, month } = calendarCursor;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const updated = { ...selectedDates };
    for (let day = 1; day <= daysInMonth; day += 1) {
      const current = new Date(year, month, day);
      const weekDay = current.getDay();
      const key = current.toISOString().split('T')[0];
      if (weekDay >= 1 && weekDay <= 5) {
        updated[key] = selectedDayType;
      }
    }
    setSelectedDates(updated);
  };

  const handleSelectWeekends = () => {
    const { year, month } = calendarCursor;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const updated = { ...selectedDates };
    for (let day = 1; day <= daysInMonth; day += 1) {
      const current = new Date(year, month, day);
      const weekDay = current.getDay();
      const key = current.toISOString().split('T')[0];
      if (weekDay === 0 || weekDay === 6) {
        updated[key] = selectedDayType;
      }
    }
    setSelectedDates(updated);
  };

  const handleClearSelection = () => {
    setSelectedDates({});
  };

  const handleInvertSelection = () => {
    const { year, month } = calendarCursor;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const updated = { ...selectedDates };
    for (let day = 1; day <= daysInMonth; day += 1) {
      const current = new Date(year, month, day);
      const key = current.toISOString().split('T')[0];
      if (updated[key]) {
        delete updated[key];
      } else {
        updated[key] = selectedDayType;
      }
    }
    setSelectedDates(updated);
  };

  const toggleGeoValidation = (value) => {
    if (value) {
      const fallbackLat = parseCoordinate(compliance.lat) ?? DEFAULT_COORDINATE.latitude;
      const fallbackLng = parseCoordinate(compliance.lng) ?? DEFAULT_COORDINATE.longitude;
      setCompliance((prev) => ({
        ...prev,
        requireGeo: true,
        lat: fallbackLat.toFixed(6),
        lng: fallbackLng.toFixed(6),
        radius: prev.radius || INITIAL_COMPLIANCE.radius
      }));
      setMapRegion((prev) => ({ ...prev, latitude: fallbackLat, longitude: fallbackLng }));
    } else {
      setCompliance((prev) => ({ ...prev, requireGeo: false }));
    }
  };

  const handleMapPress = useCallback((event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setCompliance((prev) => ({ ...prev, lat: latitude.toFixed(6), lng: longitude.toFixed(6) }));
    setMapRegion((prev) => ({ ...prev, latitude, longitude }));
  }, []);

  const adjustGeoRadius = (delta) => {
    setCompliance((prev) => {
      const current = Number.parseInt(prev.radius || '0', 10) || 0;
      const next = Math.max(50, current + delta);
      return { ...prev, radius: String(next) };
    });
  };

  // removed 12x36 pattern per UX simplification

  const validateStep = () => {
    if (currentStep === 1) {
      if (!basics.name.trim()) {
        Alert.alert('Atenção', 'Informe o nome da jornada.');
        return false;
      }
      if (!basics.type) {
        Alert.alert('Atenção', 'Selecione o tipo da jornada.');
        return false;
      }
      if (basics.dailyHours && !isValidTime(basics.dailyHours)) {
        Alert.alert('Atenção', 'Carga horária diária deve estar no formato HH:MM.');
        return false;
      }
    }

    if (currentStep === 2) {
      const hasConfiguredDay = WEEK_DAYS.some((day) => {
        const info = schedule[day.key];
        return info && info.enabled && info.type === 'Normal' && isValidTime(info.entry1) && (isValidTime(info.exit2) || isValidTime(info.exit1));
      });
      if (!hasConfiguredDay) {
        Alert.alert('Atenção', 'Configure ao menos um dia útil com horários válidos.');
        return false;
      }
    }

    if (currentStep === 4 && compliance.requireGeo) {
      if (!compliance.lat.trim() || !compliance.lng.trim()) {
        Alert.alert('Atenção', 'Informe latitude e longitude para validar geolocalização.');
        return false;
      }
      if (!compliance.radius.trim()) {
        Alert.alert('Atenção', 'Informe o raio da cerca geográfica.');
        return false;
      }
    }
    return true;
  };

  const goToStep = (step) => {
    setCurrentStep(step);
  };

  const handleNext = () => {
    if (!validateStep()) {
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEP_TITLES.length));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const calendarDays = useMemo(() => {
    const { year, month } = calendarCursor;
    const firstDay = new Date(year, month, 1);
    const firstWeekDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstWeekDay; i += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(year, month, day));
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    return cells;
  }, [calendarCursor]);

  const getCalendarSelection = (date) => {
    if (!date) {
      return null;
    }
    const key = date.toISOString().split('T')[0];
    const value = selectedDates[key];
    return CALENDAR_DAY_TYPES.find((item) => item.value === value) || null;
  };

  const handleSubmit = async () => {
    if (!validateStep()) {
      return;
    }

    const mainDay = WEEK_DAYS.find((day) => {
      const info = schedule[day.key];
      return info && info.enabled && info.type === 'Normal' && isValidTime(info.entry1) && (isValidTime(info.exit2) || isValidTime(info.exit1));
    });

    if (!mainDay) {
      Alert.alert('Atenção', 'Configure ao menos um dia útil válido para salvar.');
      return;
    }

    const mainInfo = schedule[mainDay.key];
    const startTime = mainInfo.entry1;
    const endTime = mainInfo.exit2 || mainInfo.exit1;
    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      Alert.alert('Atenção', 'Horários principais inválidos.');
      return;
    }

    const diasSemanaSelecionados = WEEK_DAYS.filter((day) => schedule[day.key]?.enabled && schedule[day.key]?.type === 'Normal').map((day) => day.key);

    const hasLunch = isValidTime(mainInfo.exit1) && isValidTime(mainInfo.entry2);
    const pauseMinutes = hasLunch ? minutesBetween(mainInfo.exit1, mainInfo.entry2) : 0;

    const configPayload = buildConfigPayload();
    const calendarPayload = buildCalendarPayload();

    const toleranceInValue = parseInt(advanced.toleranceIn || '0', 10);
    const toleranceOutValue = parseInt(advanced.toleranceOut || '0', 10);
    const closingTimeNormalized = normalizeTimeString(advanced.closingTime);
    const workdaysLabel = basics.workdays && basics.workdays.trim() ? basics.workdays.trim() : diasSemanaSelecionados.join(',');
    const dailyHoursValue = normalizeTimeString(basics.dailyHours);

    const latNumber = compliance.requireGeo ? Number.parseFloat((compliance.lat || '').replace(',', '.')) : null;
    const lngNumber = compliance.requireGeo ? Number.parseFloat((compliance.lng || '').replace(',', '.')) : null;
    const radiusNumber = compliance.requireGeo ? Number.parseInt(compliance.radius || '0', 10) : null;

    const payloadBase = {
      cad_ponto_nome: basics.name,
      cad_ponto_codigo: basics.code || null,
      cad_ponto_descricao: basics.description || null,
      cad_ponto_tipo: basics.type || null,
      cad_ponto_carga_diaria: dailyHoursValue || null,
      cad_ponto_carga_semanal: basics.weeklyHours || weeklyHoursLabel,
      cad_ponto_dias_trabalho: workdaysLabel || null,
      cad_ponto_inicio: `${startTime}:00`,
      cad_ponto_fim: `${endTime}:00`,
      cad_ponto_pausa: hasLunch,
      cad_ponto_tempo_pausa_min: pauseMinutes,
      cad_ponto_inicio_almoco: hasLunch ? `${mainInfo.exit1}:00` : null,
      cad_ponto_tolerancia_min: Number.isNaN(toleranceInValue) ? 0 : toleranceInValue,
      cad_ponto_tolerancia_saida_min: Number.isNaN(toleranceOutValue) ? 0 : toleranceOutValue,
      cad_ponto_fechamento_dia: closingTimeNormalized ? `${closingTimeNormalized}:00` : null,
      cad_ponto_falta_parcial_auto: advanced.partialAbsence,
      cad_ponto_dias_semana: diasSemanaSelecionados.join(','),
      cad_ponto_facial_required: compliance.requireFacial,
      cad_ponto_gps_enabled: compliance.requireGeo,
      cad_ponto_gps_center_lat: compliance.requireGeo && !Number.isNaN(latNumber) ? latNumber : null,
      cad_ponto_gps_center_lng: compliance.requireGeo && !Number.isNaN(lngNumber) ? lngNumber : null,
      cad_ponto_gps_radius_m: compliance.requireGeo && !Number.isNaN(radiusNumber) ? radiusNumber : null,
      calendario_aplicacao: calendarPayload,
      config_semanal: configPayload,
      usu_id: pontoEditar?.usu_id || null
    };

    try {
      setLoading(true);
      if (isEditing && pontoEditar.cad_id) {
        const result = await editarPonto(pontoEditar.cad_id, payloadBase);
        Alert.alert('Sucesso', result?.mensagem || 'Jornada atualizada com sucesso!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        return;
      }
      const result = await cadastrarPonto(payloadBase);
      Alert.alert('Cadastro concluído', result?.mensagem || 'Jornada criada com sucesso!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      console.error('Erro ao salvar jornada:', error);
      Alert.alert('Erro', `Não foi possível salvar a jornada: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const renderWizardHeader = () => (
    <View style={styles.stepperWrapper}>
      <View style={[styles.stepSummaryRow, isCompact && styles.stepSummaryRowCompact]}>
        <Text style={styles.stepSummaryIndicator}>{`Etapa ${currentStep} de ${STEP_TITLES.length}`}</Text>
        <Text style={styles.stepSummaryTitle}>{STEP_TITLES[currentStep - 1]}</Text>
      </View>
    </View>
  );

  const renderBasics = () => (
    <View>
      <Text style={styles.sectionTitle}>Identificação</Text>
      <Text style={styles.helperText}>Preencha as informações básicas da jornada. Estas informações aparecem na listagem e facilitam buscas.</Text>
      <Text style={styles.label}>Nome da Jornada</Text>
      <TextInput
        placeholder="Ex: Administrativo 44h"
        value={basics.name}
        onChangeText={(value) => setBasics((prev) => ({ ...prev, name: value }))}
        style={styles.input}
      />

      <Text style={styles.label}>Código Interno (opcional)</Text>
      <TextInput
        placeholder="Ex: ADM-001"
        value={basics.code}
        onChangeText={(value) => setBasics((prev) => ({ ...prev, code: value }))}
        style={styles.input}
      />

      <Text style={styles.label}>Descrição (opcional)</Text>
      <TextInput
        placeholder="Detalhes adicionais da jornada"
        value={basics.description}
        onChangeText={(value) => setBasics((prev) => ({ ...prev, description: value }))}
        style={[styles.input, styles.textArea]}
        multiline
      />

      <Text style={styles.label}>Tipo de Jornada</Text>
      <View style={styles.chipGroup}>
        {JOURNEY_TYPES.map((type) => {
          const selected = basics.type === type.value;
          return (
            <TouchableOpacity
              key={type.value}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => setBasics((prev) => ({ ...prev, type: type.value }))}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{type.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

    </View>
  );

  const renderSchedule = () => (
    <View>
      <Text style={styles.sectionTitle}>Horários Semanais</Text>
      <Text style={styles.helperText}>Configure os horários de cada dia da semana. Use os atalhos para repetir padrões rapidamente.</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity onPress={handleRepeatWeekdays} style={styles.quickActionButton}>
          <Text style={styles.quickActionTextPrimary}>Repetir Seg → Sex</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={openCopyModal} style={styles.quickActionButtonOutline}>
          <Text style={styles.quickActionTextOutline}>Copiar dia…</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.summaryPill}>Carga semanal calculada: {weeklyHoursLabel}</Text>

      {WEEK_DAYS.map((day) => {
        const info = schedule[day.key];
        const typeDescriptor = SCHEDULE_DAY_TYPES.find((item) => item.value === info.type);
        return (
          <View key={day.key} style={styles.dayCard}>
            <View style={styles.dayCardHeader}>
              <View style={styles.dayCardHeaderLeft}>
                <Switch value={info.enabled} onValueChange={() => toggleDayEnabled(day.key)} />
                <Text style={styles.dayCardTitle}>{day.label}</Text>
              </View>
              <TouchableOpacity onPress={() => setTypePickerDay(day.key)} style={styles.dayTypeTag}>
                <Text style={styles.dayTypeText}>{info.type}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.dayCardSubtitle}>{typeDescriptor?.description}</Text>

            {info.enabled && info.type === 'Normal' && (
              <View style={[styles.scheduleGrid, isCompact && styles.scheduleGridStack]}>
                <View style={[styles.gridColumn, isCompact && styles.gridColumnFullWidth]}>
                  <Text style={styles.label}>Entrada 1</Text>
                  <View style={styles.timeInputWrapper}>
                    <TextInput
                      style={[styles.input, styles.timeInput]}
                      value={info.entry1}
                      keyboardType="numeric"
                      onChangeText={(value) => updateSchedule(day.key, 'entry1', value)}
                      maxLength={5}
                      placeholder="08:00"
                      returnKeyType="done"
                    />
                    <TouchableOpacity
                      style={styles.timePickerButton}
                      onPress={() => openTimePicker({ type: 'schedule', dayKey: day.key, field: 'entry1', value: info.entry1 })}
                    >
                      <MaterialIcons name="schedule" size={20} color="#21808d" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={[styles.gridColumn, isCompact && styles.gridColumnFullWidth]}>
                  <Text style={styles.label}>Saída 1</Text>
                  <View style={styles.timeInputWrapper}>
                    <TextInput
                      style={[styles.input, styles.timeInput]}
                      value={info.exit1}
                      keyboardType="numeric"
                      onChangeText={(value) => updateSchedule(day.key, 'exit1', value)}
                      maxLength={5}
                      placeholder="12:00"
                      returnKeyType="done"
                    />
                    <TouchableOpacity
                      style={styles.timePickerButton}
                      onPress={() => openTimePicker({ type: 'schedule', dayKey: day.key, field: 'exit1', value: info.exit1 })}
                    >
                      <MaterialIcons name="schedule" size={20} color="#21808d" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={[styles.gridColumn, isCompact && styles.gridColumnFullWidth]}>
                  <Text style={styles.label}>Entrada 2</Text>
                  <View style={styles.timeInputWrapper}>
                    <TextInput
                      style={[styles.input, styles.timeInput]}
                      value={info.entry2}
                      keyboardType="numeric"
                      onChangeText={(value) => updateSchedule(day.key, 'entry2', value)}
                      maxLength={5}
                      placeholder="13:00"
                      returnKeyType="done"
                    />
                    <TouchableOpacity
                      style={styles.timePickerButton}
                      onPress={() => openTimePicker({ type: 'schedule', dayKey: day.key, field: 'entry2', value: info.entry2 })}
                    >
                      <MaterialIcons name="schedule" size={20} color="#21808d" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={[styles.gridColumn, isCompact && styles.gridColumnFullWidth]}>
                  <Text style={styles.label}>Saída 2</Text>
                  <View style={styles.timeInputWrapper}>
                    <TextInput
                      style={[styles.input, styles.timeInput]}
                      value={info.exit2}
                      keyboardType="numeric"
                      onChangeText={(value) => updateSchedule(day.key, 'exit2', value)}
                      maxLength={5}
                      placeholder="17:48"
                      returnKeyType="done"
                    />
                    <TouchableOpacity
                      style={styles.timePickerButton}
                      onPress={() => openTimePicker({ type: 'schedule', dayKey: day.key, field: 'exit2', value: info.exit2 })}
                    >
                      <MaterialIcons name="schedule" size={20} color="#21808d" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );

  const renderCalendarStep = () => {
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return (
      <View>
        <Text style={styles.sectionTitle}>Aplicação no Calendário</Text>
        <Text style={styles.helperText}>Selecione facilmente os dias em que esta jornada será aplicada. Utilize filtros e padrões para agilizar o processo.</Text>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => moveCalendar(-1)} style={styles.calendarNavButton}>
            <Text style={styles.calendarNavText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.calendarTitle}>{`${monthNames[calendarCursor.month]} ${calendarCursor.year}`}</Text>
          <TouchableOpacity onPress={() => moveCalendar(1)} style={styles.calendarNavButton}>
            <Text style={styles.calendarNavText}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.dayTypeSelector, isCompact && styles.dayTypeSelectorWrap]}>
          {CALENDAR_DAY_TYPES.map((type, index) => {
            const active = selectedDayType === type.value;
            const isLast = index === CALENDAR_DAY_TYPES.length - 1;
            return (
              <TouchableOpacity
                key={type.value}
                onPress={() => setSelectedDayType(type.value)}
                style={[
                  styles.dayTypeOption,
                  isLast && !isCompact && styles.dayTypeOptionLast,
                  isCompact && styles.dayTypeOptionCompact,
                  { borderColor: type.color, backgroundColor: active ? type.color : '#fff' }
                ]}
              >
                <Text style={[styles.dayTypeOptionText, active && styles.dayTypeOptionTextActive]}>{type.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.calendarActions}>
          <TouchableOpacity style={styles.quickActionButton} onPress={handleSelectWeekdays}>
            <Text style={styles.quickActionTextPrimary}>Dias úteis</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={handleSelectWeekends}>
            <Text style={styles.quickActionTextPrimary}>Fins de semana</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButtonOutline} onPress={handleInvertSelection}>
            <Text style={styles.quickActionTextOutline}>Inverter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButtonOutline} onPress={handleClearSelection}>
            <Text style={styles.quickActionTextOutline}>Limpar</Text>
          </TouchableOpacity>
        </View>

        {/* Removed interval selection and 12x36 pattern actions by request */}

        <View style={styles.calendarWeekHeader}>
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((abbr) => (
            <Text key={abbr} style={styles.calendarWeekDay}>{abbr}</Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {calendarDays.map((date, index) => (
            <CalendarDay
              key={`${date ? date.toISOString() : 'empty'}-${index}`}
              day={date}
              onPress={handleCalendarDayPress}
              isCurrentMonth={Boolean(date)}
              selection={date ? selectedDates[date.toISOString().split('T')[0]] : null}
              dayType={date ? getCalendarSelection(date) : null}
            />
          ))}
        </View>

        <View style={styles.legendContainer}>
          {CALENDAR_DAY_TYPES.map((type) => (
            <View key={type.value} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: type.color }]} />
              <Text style={styles.legendText}>{type.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.summaryPill}>{selectedCount} dias selecionados</Text>
      </View>
    );
  };

  const renderAdvanced = () => (
    <View>
      <Text style={styles.sectionTitle}>Configurações Avançadas</Text>
      <Text style={styles.helperText}>Ajuste tolerâncias e políticas complementares da jornada.</Text>

      <View style={[styles.rowInline, isCompact && styles.rowInlineStack]}>
        <View style={[styles.flexItem, styles.flexItemSpacing, isCompact && styles.flexItemStacked]}>
          <Text style={styles.label}>Tolerância Entrada (min)</Text>
          <TextInput
            style={styles.input}
            value={advanced.toleranceIn}
            onChangeText={(value) => setAdvanced((prev) => ({ ...prev, toleranceIn: value.replace(/[^0-9]/g, '') }))}
            keyboardType="numeric"
            placeholder="05"
          />
        </View>
        <View style={[styles.flexItem, styles.flexItemSpacing, isCompact && styles.flexItemStacked]}>
          <Text style={styles.label}>Tolerância Saída (min)</Text>
          <TextInput
            style={styles.input}
            value={advanced.toleranceOut}
            onChangeText={(value) => setAdvanced((prev) => ({ ...prev, toleranceOut: value.replace(/[^0-9]/g, '') }))}
            keyboardType="numeric"
            placeholder="05"
          />
        </View>
        <View style={[styles.flexItem, isCompact && styles.flexItemStackedLast]}>
          <Text style={styles.label}>Fechamento do Dia</Text>
          <View style={styles.timeInputWrapper}>
            <TextInput
              style={[styles.input, styles.timeInput]}
              value={advanced.closingTime}
              onChangeText={(value) => setAdvanced((prev) => ({ ...prev, closingTime: formatTimeInput(value) }))}
              keyboardType="numeric"
              maxLength={5}
              placeholder="00:00"
              returnKeyType="done"
            />
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => openTimePicker({ type: 'closingTime', value: advanced.closingTime })}
            >
              <MaterialIcons name="schedule" size={20} color="#21808d" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={[styles.toggleRow, { marginTop: 4 }]}>
        <Text style={styles.toggleLabel}>Falta parcial automática</Text>
        <Switch value={advanced.partialAbsence} onValueChange={(value) => setAdvanced((prev) => ({ ...prev, partialAbsence: value }))} />
      </View>

      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Políticas de validação</Text>
      <Text style={styles.helperText}>Defina se esta jornada exige reconhecimento facial ou validação por geolocalização.</Text>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Exigir reconhecimento facial</Text>
        <Switch value={compliance.requireFacial} onValueChange={(value) => setCompliance((prev) => ({ ...prev, requireFacial: value }))} />
      </View>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Validar geolocalização</Text>
        <Switch value={compliance.requireGeo} onValueChange={toggleGeoValidation} />
      </View>

      {compliance.requireGeo && (
        <>
          <Text style={styles.helperText}>Escolha o ponto central direto no mapa e ajuste o raio permitido.</Text>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.geoMap}
            region={mapRegion}
            onRegionChangeComplete={(region) => setMapRegion(region)}
            onPress={handleMapPress}
          >
            <Marker coordinate={{ latitude: mapRegion.latitude, longitude: mapRegion.longitude }} />
            {Number.parseInt(compliance.radius || '0', 10) > 0 && (
              <Circle
                center={{ latitude: mapRegion.latitude, longitude: mapRegion.longitude }}
                radius={Number.parseInt(compliance.radius || '0', 10)}
                strokeColor="rgba(33,128,141,0.8)"
                fillColor="rgba(33,128,141,0.2)"
              />
            )}
          </MapView>
          <View style={[styles.geoActionsRow, isCompact && styles.geoActionsRowCompact]}>
            <TouchableOpacity style={[styles.geoActionButton, isCompact && styles.geoActionButtonCompact]} onPress={() => adjustGeoRadius(-50)}>
              <Text style={styles.geoActionText}>-50m</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.geoActionButton, isCompact && styles.geoActionButtonCompact]} onPress={() => adjustGeoRadius(-10)}>
              <Text style={styles.geoActionText}>-10m</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.geoActionButton, isCompact && styles.geoActionButtonCompact]} onPress={() => adjustGeoRadius(10)}>
              <Text style={styles.geoActionText}>+10m</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.geoActionButton, isCompact && styles.geoActionButtonCompact]} onPress={() => adjustGeoRadius(50)}>
              <Text style={styles.geoActionText}>+50m</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.rowInline, isCompact && styles.rowInlineStack]}>
            <View style={[styles.flexItem, styles.flexItemSpacing, isCompact && styles.flexItemStacked]}>
              <Text style={styles.label}>Latitude central</Text>
              <TextInput
                style={styles.input}
                value={compliance.lat}
                keyboardType="numeric"
                onChangeText={(value) => setCompliance((prev) => ({ ...prev, lat: value }))}
                placeholder="Ex: -23.5612"
              />
            </View>
            <View style={[styles.flexItem, styles.flexItemSpacing, isCompact && styles.flexItemStacked]}>
              <Text style={styles.label}>Longitude central</Text>
              <TextInput
                style={styles.input}
                value={compliance.lng}
                keyboardType="numeric"
                onChangeText={(value) => setCompliance((prev) => ({ ...prev, lng: value }))}
                placeholder="Ex: -46.6559"
              />
            </View>
            <View style={[styles.flexItem, isCompact && styles.flexItemStackedLast]}>
              <Text style={styles.label}>Raio (metros)</Text>
              <TextInput
                style={styles.input}
                value={compliance.radius}
                keyboardType="numeric"
                onChangeText={(value) => setCompliance((prev) => ({ ...prev, radius: value.replace(/[^0-9]/g, '') }))}
                placeholder="200"
              />
            </View>
          </View>
        </>
      )}
    </View>
  );

  const renderSummary = () => (
    <View>
      <Text style={styles.sectionTitle}>Resumo antes de salvar</Text>
      <Text style={styles.helperText}>Revise rapidamente as configurações. Você pode voltar a qualquer passo clicando em "Editar".</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Informações básicas</Text>
          <TouchableOpacity onPress={() => goToStep(1)}>
            <Text style={styles.editLink}>Editar</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.summaryRow}><Text style={styles.summaryLabel}>Nome:</Text> {basics.name || '-'}</Text>
        <Text style={styles.summaryRow}><Text style={styles.summaryLabel}>Código:</Text> {basics.code || '-'}</Text>
        <Text style={styles.summaryRow}><Text style={styles.summaryLabel}>Tipo:</Text> {basics.type || '-'}</Text>
        <Text style={styles.summaryRow}><Text style={styles.summaryLabel}>Carga diária:</Text> {basics.dailyHours || '-'}</Text>
        <Text style={styles.summaryRow}><Text style={styles.summaryLabel}>Carga semanal:</Text> {basics.weeklyHours || weeklyHoursLabel}</Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Configuração semanal</Text>
          <TouchableOpacity onPress={() => goToStep(2)}>
            <Text style={styles.editLink}>Editar</Text>
          </TouchableOpacity>
        </View>
        {WEEK_DAYS.map((day) => {
          const info = schedule[day.key];
          if (!info) {
            return null;
          }
          return (
            <Text key={day.key} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{day.short}:</Text>
              {` ${info.type}`}
              {info.enabled && info.type === 'Normal' ? ` • ${info.entry1 || '--:--'} - ${info.exit2 || info.exit1 || '--:--'}` : ''}
            </Text>
          );
        })}
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Calendário</Text>
          <TouchableOpacity onPress={() => goToStep(3)}>
            <Text style={styles.editLink}>Editar</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.summaryRow}><Text style={styles.summaryLabel}>Dias selecionados:</Text> {selectedCount}</Text>
        <View style={styles.summaryTagList}>
          {Object.entries(selectedDates)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(0, 10)
            .map(([date, type]) => (
            <View key={date} style={styles.summaryTag}>
              <Text style={styles.summaryTagText}>{date} • {type}</Text>
            </View>
          ))}
          {selectedCount > 10 && <Text style={styles.helperText}>+ {selectedCount - 10} dias</Text>}
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Configurações avançadas</Text>
          <TouchableOpacity onPress={() => goToStep(4)}>
            <Text style={styles.editLink}>Editar</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.summaryRow}><Text style={styles.summaryLabel}>Tolerância:</Text> Entrada {advanced.toleranceIn || '0'} min / Saída {advanced.toleranceOut || '0'} min</Text>
        <Text style={styles.summaryRow}><Text style={styles.summaryLabel}>Políticas:</Text> {advanced.partialAbsence ? 'Falta parcial automática' : 'Sem falta parcial automática'}</Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Políticas e validações</Text>
          <TouchableOpacity onPress={() => goToStep(4)}>
            <Text style={styles.editLink}>Editar</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.summaryRow}><Text style={styles.summaryLabel}>Reconhecimento facial:</Text> {compliance.requireFacial ? 'Obrigatório' : 'Não exigido'}</Text>
        <Text style={styles.summaryRow}><Text style={styles.summaryLabel}>Validação geográfica:</Text> {compliance.requireGeo ? 'Ativada' : 'Desativada'}</Text>
        {compliance.requireGeo && (
          <>
            <Text style={styles.summaryRow}><Text style={styles.summaryLabel}>Latitude:</Text> {compliance.lat || '-'}</Text>
            <Text style={styles.summaryRow}><Text style={styles.summaryLabel}>Longitude:</Text> {compliance.lng || '-'}</Text>
            <Text style={styles.summaryRow}><Text style={styles.summaryLabel}>Raio:</Text> {compliance.radius ? `${compliance.radius} m` : '-'}</Text>
          </>
        )}
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasics();
      case 2:
        return renderSchedule();
      case 3:
        return renderCalendarStep();
      case 4:
        return renderAdvanced();
      case 5:
      default:
        return renderSummary();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.container, isCompact && styles.containerCompact]}>
        <Text style={styles.title}>{isEditing ? 'Editar Jornada' : 'Nova Jornada'}</Text>
        {renderWizardHeader()}
        <View style={[styles.stepContent, isCompact && styles.stepContentCompact]}>{renderStepContent()}</View>
      </ScrollView>

      <View style={[styles.footer, isCompact && styles.footerStack]}>
        <TouchableOpacity
          onPress={handlePrev}
          disabled={currentStep === 1 || loading}
          style={[styles.footerButton, currentStep === 1 ? styles.footerButtonDisabled : styles.footerButtonSecondary, isCompact && styles.footerButtonFullWidth]}
        >
          <Text style={[styles.footerButtonText, currentStep === 1 ? styles.footerButtonTextDisabled : styles.footerButtonTextSecondary]}>Voltar</Text>
        </TouchableOpacity>
        {currentStep < STEP_TITLES.length ? (
          <TouchableOpacity
            onPress={handleNext}
            disabled={loading}
            style={[styles.footerButton, styles.footerButtonPrimary, isCompact && styles.footerButtonFullWidth, isCompact && styles.footerButtonLastCompact]}
          >
            <Text style={[styles.footerButtonText, styles.footerButtonTextPrimary]}>{'Avançar'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.footerButton, styles.footerButtonPrimary, isCompact && styles.footerButtonFullWidth, isCompact && styles.footerButtonLastCompact]}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.footerButtonText, styles.footerButtonTextPrimary]}>{isEditing ? 'Salvar alterações' : 'Salvar jornada'}</Text>}
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={typePickerDay !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Tipo de dia</Text>
            {SCHEDULE_DAY_TYPES.map((type) => {
              const selected = schedule[typePickerDay || 1]?.type === type.value;
              return (
                <TouchableOpacity
                  key={type.value}
                  style={[styles.modalOption, selected && styles.modalOptionSelected]}
                  onPress={() => {
                    if (typePickerDay !== null) {
                      setSchedule((prev) => ({
                        ...prev,
                        [typePickerDay]: {
                          ...prev[typePickerDay],
                          type: type.value,
                          enabled: type.value === 'Normal' ? true : prev[typePickerDay].enabled
                        }
                      }));
                    }
                    setTypePickerDay(null);
                  }}
                >
                  <View style={[styles.legendColor, { backgroundColor: type.accent }]} />
                  <View style={styles.modalOptionContent}>
                    <Text style={[styles.modalOptionText, selected && styles.modalOptionTextSelected]}>{type.label}</Text>
                    <Text style={styles.modalOptionSub}>{type.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity onPress={() => setTypePickerDay(null)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={copyModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Copiar horários</Text>
            <Text style={styles.helperText}>Selecione um dia de origem e os dias de destino que receberão os mesmos horários.</Text>
            <Text style={styles.label}>Origem</Text>
            <View style={styles.chipGroup}>
              {WEEK_DAYS.map((day) => (
                <TouchableOpacity
                  key={`source-${day.key}`}
                  onPress={() => setCopySource(day.key)}
                  style={[styles.chip, copySource === day.key && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, copySource === day.key && styles.chipTextSelected]}>{day.short}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Destinos</Text>
            <View style={styles.chipGroup}>
              {WEEK_DAYS.map((day) => {
                const active = copyTargets.includes(day.key);
                return (
                  <TouchableOpacity
                    key={`target-${day.key}`}
                    onPress={() => {
                      setCopyTargets((prev) => (prev.includes(day.key) ? prev.filter((item) => item !== day.key) : [...prev, day.key]));
                    }}
                    style={[styles.chip, active && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextSelected]}>{day.short}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setCopyModalVisible(false)} style={[styles.footerButton, styles.footerButtonSecondary]}>
                <Text style={[styles.footerButtonText, styles.footerButtonTextSecondary]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={applyCopy} style={[styles.footerButton, styles.footerButtonPrimary]}>
                <Text style={[styles.footerButtonText, styles.footerButtonTextPrimary]}>Copiar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TimePickerModal
        visible={timePickerState.visible}
        onDismiss={closeTimePicker}
        onConfirm={handleTimeConfirm}
        hours={timePickerState.hours}
        minutes={timePickerState.minutes}
        cancelLabel="Cancelar"
        confirmLabel="Definir"
        locale="pt"
        keyboardIconColor="#21808d"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7f5' },
  container: { paddingBottom: 120, paddingHorizontal: 20 },
  containerCompact: { paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '700', marginVertical: 16, textAlign: 'center', color: '#13343b' },
  stepIndicatorContainer: { flexDirection: 'column', marginBottom: 24 },
  stepIndicatorItem: { alignItems: 'center', marginBottom: 12 },
  stepperWrapper: { marginBottom: 16 },
  stepSummaryRow: { marginBottom: 12, backgroundColor: '#f1f5f9', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 },
  stepSummaryRowCompact: { alignItems: 'flex-start' },
  stepSummaryIndicator: { color: '#21808d', fontWeight: '700', fontSize: 13 },
  stepSummaryTitle: { color: '#13343b', fontWeight: '600', fontSize: 16, marginTop: 2 },
  stepContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e2e4e6' },
  stepContentCompact: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#13343b', marginBottom: 8 },
  helperText: { fontSize: 13, color: '#626c71', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#13343b', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#d3d6d8', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#fff', marginBottom: 12 },
  timeInputWrapper: { position: 'relative', justifyContent: 'center' },
  timeInput: { paddingRight: 44 },
  timePickerButton: { position: 'absolute', right: 10, top: 8, bottom: 12, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10, borderRadius: 999, backgroundColor: '#e6f4f6' },
  textArea: { minHeight: 80 },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  chip: { borderWidth: 1, borderColor: '#d3d6d8', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  chipSelected: { backgroundColor: '#21808d', borderColor: '#21808d' },
  chipText: { color: '#13343b', fontSize: 14 },
  chipTextSelected: { color: '#fff' },
  rowInline: { flexDirection: 'row', marginBottom: 12 },
  rowInlineStack: { flexDirection: 'column' },
  diagonalGroup: { marginBottom: 12 },
  diagonalItemLevel1: { marginBottom: 12, paddingRight: 24 },
  diagonalItemLevel2: { marginBottom: 12, paddingLeft: 16, paddingRight: 8 },
  diagonalItemLevel3: { marginBottom: 12, paddingLeft: 32 },
  flexItem: { flex: 1 },
  flexItemSpacing: { marginRight: 12 },
  flexItemStacked: { width: '100%', marginRight: 0, marginBottom: 12 },
  flexItemStackedLast: { width: '100%', marginRight: 0 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  quickActionButton: { backgroundColor: '#21808d', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginRight: 8, marginBottom: 8 },
  quickActionButtonOutline: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#21808d', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginRight: 8, marginBottom: 8 },
  quickActionTextPrimary: { color: '#fff', fontWeight: '600' },
  quickActionTextOutline: { color: '#21808d', fontWeight: '600' },
  summaryPill: { alignSelf: 'flex-start', backgroundColor: '#e6f4f6', color: '#155e63', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, fontSize: 12, marginVertical: 12 },
  divider: { height: 1, backgroundColor: '#e2e4e6', marginVertical: 16 },
  dayCard: { borderWidth: 1, borderColor: '#dfe3e5', borderRadius: 12, padding: 16, marginBottom: 16, backgroundColor: '#fafafa' },
  dayCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dayCardHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  dayCardTitle: { fontSize: 16, fontWeight: '600', color: '#13343b' },
  dayTypeTag: { backgroundColor: '#21808d', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  dayTypeText: { color: '#fff', fontWeight: '600' },
  dayCardSubtitle: { fontSize: 12, color: '#626c71', marginBottom: 12 },
  scheduleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  scheduleGridStack: { flexDirection: 'column' },
  gridColumn: { width: '48%', marginBottom: 12 },
  gridColumnFullWidth: { width: '100%' },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  calendarNavButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#e6f4f6' },
  calendarNavText: { fontSize: 18, color: '#13343b' },
  calendarTitle: { fontSize: 16, fontWeight: '600', color: '#13343b' },
  dayTypeSelector: { flexDirection: 'row', marginBottom: 16 },
  dayTypeSelectorWrap: { flexDirection: 'column' },
  dayTypeOption: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginRight: 12 },
  dayTypeOptionLast: { marginRight: 0 },
  dayTypeOptionCompact: { width: '100%', marginRight: 0, marginBottom: 8 },
  dayTypeOptionText: { color: '#13343b', fontWeight: '600' },
  dayTypeOptionTextActive: { color: '#fff' },
  calendarActions: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  calendarWeekHeader: { flexDirection: 'row', marginBottom: 8 },
  calendarWeekDay: { flex: 1, textAlign: 'center', fontWeight: '600', color: '#13343b' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: '#dfe3e5', borderRadius: 12 },
  calendarDay: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#dfe3e5' },
  calendarDayDisabled: { backgroundColor: '#f1f3f5' },
  calendarDayText: { color: '#13343b' },
  calendarDayTextDisabled: { color: '#b0b7ba' },
  legendContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 8 },
  legendColor: { width: 14, height: 14, borderRadius: 3, marginRight: 8 },
  legendText: { fontSize: 12, color: '#13343b' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  toggleLabel: { fontSize: 14, color: '#13343b' },
  summaryCard: { borderWidth: 1, borderColor: '#dfe3e5', borderRadius: 12, padding: 16, marginBottom: 16, backgroundColor: '#fafafa' },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryTitle: { fontSize: 16, fontWeight: '600', color: '#13343b' },
  summaryRow: { fontSize: 14, color: '#13343b', marginBottom: 6 },
  summaryLabel: { fontWeight: '600' },
  editLink: { color: '#21808d', fontWeight: '600' },
  summaryTagList: { flexDirection: 'row', flexWrap: 'wrap' },
  summaryTag: { backgroundColor: '#e6f4f6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginRight: 8, marginBottom: 8 },
  summaryTagText: { color: '#13343b', fontSize: 12 },
  geoMap: { width: '100%', height: 220, borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  geoActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  geoActionsRowCompact: { flexWrap: 'wrap' },
  geoActionButton: { flex: 1, borderWidth: 1, borderColor: '#21808d', borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginHorizontal: 4 },
  geoActionButtonCompact: { flexBasis: '48%', marginHorizontal: 0, marginVertical: 4 },
  geoActionText: { color: '#21808d', fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#dfe3e5' },
  footerStack: { flexDirection: 'column' },
  footerButton: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, marginHorizontal: 6 },
  footerButtonFullWidth: { flex: undefined, width: '100%', marginHorizontal: 0, marginBottom: 12 },
  footerButtonLastCompact: { marginBottom: 0 },
  footerButtonPrimary: { backgroundColor: '#21808d' },
  footerButtonSecondary: { borderWidth: 1, borderColor: '#d3d6d8', backgroundColor: '#fff' },
  footerButtonDisabled: { backgroundColor: '#f1f3f5', borderWidth: 1, borderColor: '#d3d6d8' },
  footerButtonText: { fontSize: 16, fontWeight: '600', color: '#13343b' },
  footerButtonTextDisabled: { color: '#b0b7ba' },
  footerButtonTextPrimary: { color: '#fff' },
  footerButtonTextSecondary: { color: '#13343b' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 380, backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#13343b', marginBottom: 12 },
  modalOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: '#dfe3e5', marginBottom: 10 },
  modalOptionSelected: { backgroundColor: '#e6f4f6', borderColor: '#21808d' },
  modalOptionContent: { marginLeft: 12 },
  modalOptionText: { fontSize: 15, fontWeight: '600', color: '#13343b' },
  modalOptionTextSelected: { color: '#21808d' },
  modalOptionSub: { fontSize: 12, color: '#626c71', marginTop: 2 },
  modalClose: { marginTop: 6, alignItems: 'flex-end' },
  modalCloseText: { color: '#21808d', fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }
});
