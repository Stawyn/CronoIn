// src/screens/Usuario/Cadastro.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  useWindowDimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { cadastrarUsuarioCompleto, listarOpcoesCadastro, buscarUsuarioPorId, editarUsuario } from '../../services/UsuarioService';
import { API_BASE_URL } from '../../api/api';

const formatarCPF = (value) => {
  const numeros = value.replace(/[^\d]/g, '');
  if (numeros.length <= 3) return numeros;
  if (numeros.length <= 6) return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
  if (numeros.length <= 9) return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9, 11)}`;
};

const formatarCelular = (value) => {
  const numeros = value.replace(/[^\d]/g, '');
  if (numeros.length <= 2) return `(${numeros}`;
  if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
};

const formatarCEP = (value) => {
  const numeros = value.replace(/[^\d]/g, '').slice(0, 8);
  if (numeros.length <= 5) return numeros;
  return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
};

const isValidEmail = (value) => {
  if (!value) return false;
  const trimmed = value.trim();
  // Simple RFC-like validation
  return /.+@.+\..+/.test(trimmed);
};

const resolveMediaUrl = (url) => {
  if (!url) {
    return '';
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${API_BASE_URL}${url}`;
};

const STEPS = [
  { id: 1, titulo: 'Informações Pessoais', icon: '👤' },
  { id: 2, titulo: 'Informações Trabalhistas', icon: '💼' },
  { id: 3, titulo: 'Configurações de Ponto', icon: '⏱️' },
  { id: 4, titulo: 'Biometria e Acesso', icon: '🔐' },
  { id: 5, titulo: 'Documentos', icon: '�' },
  { id: 6, titulo: 'Revisão Final', icon: '✅' }
];

const PERFIS_FIXOS = ['Colaborador', 'Administrador'];

const initialState = {
  pessoais: {
    nome: '',
    nomeSocial: '',
    cpf: '',
    rg: '',
    orgaoEmissor: '',
    nascimento: '',
    genero: '',
    estadoCivil: ''
  },
  contato: {
    emailPessoal: '',
    emailCorporativo: '',
    celular: '',
    telefone: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  },
  trabalho: {
    empresaNome: '',
    departamento: '',
    cargo: '',
    gestorId: null,
    dataAdmissao: '',
    tipoContrato: 'CLT'
  },
  configPonto: {
    jornadaId: null
  },
  acesso: {
    login: '',
    senha: '',
    perfil: PERFIS_FIXOS[0],
    ativo: true
  },
  observacoes: '',
  fotoBase64: ''
};

export default function CadastroScreen({ navigation, route = {} }) {
  const usuarioSelecionado = route?.params?.usuario;
  const editingId = usuarioSelecionado?.usu_id ?? null;
  const isEditing = Boolean(editingId);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialState);
  const [options, setOptions] = useState({ empresas: [], departamentos: [], cargos: [], perfis: [], cercas: [], jornadas: [], gestores: [] });
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [fotoPreview, setFotoPreview] = useState('');
  const [fotoStatus, setFotoStatus] = useState('Nenhuma foto analisada');
  const [analisandoFoto, setAnalisandoFoto] = useState(false);
  const [fotoErro, setFotoErro] = useState('');
  const [loadingUsuario, setLoadingUsuario] = useState(isEditing);
  const { width } = useWindowDimensions();
  const isCompact = width < 768;

  useEffect(() => {
    const load = async () => {
      try {
        const data = await listarOpcoesCadastro();
        setOptions(data);
        setFormData((prev) => ({
          ...prev,
          trabalho: {
            ...prev.trabalho,
            empresaNome: '',
            departamento: '',
            cargo: ''
          },
          configPonto: {
            ...prev.configPonto,
            jornadaId: isEditing ? prev.configPonto.jornadaId : data.jornadas?.[0]?.cad_id || null
          },
          acesso: {
            ...prev.acesso,
            perfil: prev.acesso.perfil || PERFIS_FIXOS[0]
          }
        }));
      } catch (error) {
        Alert.alert('Erro', error.message || 'Não foi possível carregar as opções.');
      } finally {
        setLoadingOptions(false);
      }
    };
    load();
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing || !editingId) {
      setLoadingUsuario(false);
      return;
    }

    const carregarUsuario = async () => {
      setLoadingUsuario(true);
      try {
        const data = await buscarUsuarioPorId(editingId);
        const extras = data.extras || {};
        const dadosPessoais = extras?.dados_pessoais || {};
        const contatoExtras = dadosPessoais?.contato || {};
        const dadosTrabalhistas = extras?.dados_trabalhistas || {};
        const configPontoExtra = extras?.config_ponto || {};
        const biometriaAcesso = extras?.biometria_acesso || {};
        const preferencias = data.preferencias || {};

        const fotoUrl = resolveMediaUrl(data.usu_foto_url);
        const jornadaSelecionada = configPontoExtra.jornadaId || data.usu_jornada_padrao_id || null;
        const celularOrigem = contatoExtras.celular || data.usu_telefone || '';

        setFormData((prev) => ({
          ...prev,
          pessoais: {
            ...prev.pessoais,
            nome: data.usu_nome || '',
            nomeSocial: dadosPessoais?.nomeSocial || '',
            cpf: data.usu_cpf ? formatarCPF(data.usu_cpf) : '',
            rg: dadosPessoais?.rg || '',
            orgaoEmissor: dadosPessoais?.orgaoEmissor || '',
            nascimento: dadosPessoais?.nascimento || '',
            genero: dadosPessoais?.genero || '',
            estadoCivil: dadosPessoais?.estadoCivil || ''
          },
          contato: {
            ...prev.contato,
            emailPessoal: contatoExtras.emailPessoal || '',
            emailCorporativo: data.usu_email || contatoExtras.emailCorporativo || '',
            celular: celularOrigem ? formatarCelular(celularOrigem) : '',
            telefone: contatoExtras.telefone || '',
            cep: contatoExtras.cep || '',
            logradouro: contatoExtras.logradouro || '',
            numero: contatoExtras.numero || '',
            complemento: contatoExtras.complemento || '',
            bairro: contatoExtras.bairro || '',
            cidade: contatoExtras.cidade || '',
            estado: contatoExtras.estado || ''
          },
          trabalho: {
            ...prev.trabalho,
            empresaNome: '',
            departamento: '',
            cargo: '',
            gestorId: dadosTrabalhistas?.gestorId || null,
            dataAdmissao: dadosTrabalhistas?.dataAdmissao || '',
            tipoContrato: dadosTrabalhistas?.tipoContrato || prev.trabalho.tipoContrato
          },
          configPonto: {
            ...prev.configPonto,
            jornadaId: jornadaSelecionada
          },
          acesso: {
            ...prev.acesso,
            login: biometriaAcesso?.login || data.usu_email || '',
            senha: '',
            perfil: data.usu_permissao || prev.acesso.perfil,
            ativo: data.usu_ativo !== 0
          },
          observacoes: preferencias?.observacoes || '',
          fotoBase64: ''
        }));

        setFotoPreview(fotoUrl);
        setFotoStatus(fotoUrl ? 'Foto atual carregada. Capture novamente para atualizar.' : 'Nenhuma foto analisada');
        setFotoErro('');
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        Alert.alert('Erro', error.message || 'Não foi possível carregar os dados do colaborador.');
      } finally {
        setLoadingUsuario(false);
      }
    };

    carregarUsuario();
  }, [isEditing, editingId]);

  const updateSection = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const sanitizeNumber = (value) => value.replace(/[^\d]/g, '');

  const processarImagemSelecionada = async (pickerResult) => {
    if (!pickerResult || pickerResult.canceled || !pickerResult.assets?.length) {
      return;
    }
    const asset = pickerResult.assets[0];
    if (!asset?.uri) {
      throw new Error('Não foi possível acessar a imagem selecionada.');
    }

    setAnalisandoFoto(true);
    setFotoErro('');
    try {
      if (!asset.base64) {
        throw new Error('Não foi possível converter a imagem para envio.');
      }
      const payload = `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`;
      setFormData((prev) => ({ ...prev, fotoBase64: payload }));
      setFotoPreview(asset.uri);
      setFotoStatus('Foto enviada; hash facial será calculado no servidor.');
    } catch (error) {
      console.error('Erro ao analisar biometria:', error);
      setFotoErro(error.message || 'Não foi possível analisar a foto.');
      setFotoStatus('Falha na análise facial');
    } finally {
      setAnalisandoFoto(false);
    }
  };

  const selecionarFoto = async (modo) => {
    try {
      const permissionFn =
        modo === 'camera' ? ImagePicker.requestCameraPermissionsAsync : ImagePicker.requestMediaLibraryPermissionsAsync;
      const { status } = await permissionFn();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Conceda acesso para continuar.');
        return;
      }

      const pickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
        base64: true
      };

      const result =
        modo === 'camera'
          ? await ImagePicker.launchCameraAsync(pickerOptions)
          : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      await processarImagemSelecionada(result);
    } catch (error) {
      console.error('Erro ao escolher foto:', error);
      Alert.alert('Erro', error.message || 'Não foi possível capturar ou selecionar a foto.');
    }
  };

  const validateStep = (step) => {
    const stepErrors = {};
    if (step === 1) {
      if (!formData.pessoais.nome.trim()) stepErrors.nome = 'Nome obrigatório';
      if (!formData.contato.emailCorporativo.trim()) stepErrors.emailCorporativo = 'Email corporativo obrigatório';
      if (formData.contato.emailCorporativo && !isValidEmail(formData.contato.emailCorporativo)) {
        stepErrors.emailCorporativo = 'Informe um email corporativo válido';
      }
      if (sanitizeNumber(formData.pessoais.cpf).length !== 11) stepErrors.cpf = 'CPF inválido';
      if (sanitizeNumber(formData.contato.celular).length < 10) stepErrors.celular = 'Celular obrigatório';
    }
    if (step === 2) {
      if (!formData.trabalho.departamento.trim()) stepErrors.departamento = 'Departamento obrigatório';
      if (!formData.trabalho.cargo.trim()) stepErrors.cargo = 'Cargo obrigatório';
    }
    if (step === 3) {
      if (!formData.configPonto.jornadaId) stepErrors.jornadaId = 'Selecione uma jornada';
    }
    if (step === 4) {
      if (!formData.acesso.login.trim()) stepErrors.login = 'Login obrigatório';
      if (!isEditing && (!formData.acesso.senha || formData.acesso.senha.length < 6)) {
        stepErrors.senha = 'Senha deve ter 6+ caracteres';
      }
      if (isEditing && formData.acesso.senha && formData.acesso.senha.length < 6) {
        stepErrors.senha = 'Senha deve ter 6+ caracteres';
      }
    }
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrev = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const stepCompletion = useMemo(() => {
    return STEPS.map((step) => ({
      ...step,
      completed: step.id < currentStep
    }));
  }, [currentStep]);

  const currentStepMeta = useMemo(() => STEPS.find((step) => step.id === currentStep) || STEPS[0], [currentStep]);

  const buildPayload = () => {
    const jornada = formData.configPonto.jornadaId
      ? { modo: 'existente', cad_id: formData.configPonto.jornadaId }
      : null;

    const extras = {
      dados_pessoais: {
        ...formData.pessoais,
        contato: formData.contato
      },
      dados_trabalhistas: formData.trabalho,
      config_ponto: formData.configPonto,
      biometria_acesso: {
        ...formData.acesso,
        biometria_status: fotoStatus
      },
      documentos: null
    };

    const preferencias = {
      observacoes: formData.observacoes
    };

    if (isEditing) {
      const usuarioEdicao = {
        usu_nome: formData.pessoais.nome,
        usu_email: formData.contato.emailCorporativo.trim(),
        usu_telefone: sanitizeNumber(formData.contato.celular),
        usu_departamento: formData.trabalho.departamento,
        usu_permissao: formData.acesso.perfil,
        usu_ativo: !!formData.acesso.ativo,
        usu_foto_base64: formData.fotoBase64 || null,
        nova_senha: formData.acesso.senha ? formData.acesso.senha : null
      };
      return { usuario: usuarioEdicao, jornada, extras, preferencias };
    }

    const usuarioCadastro = {
      usu_nome: formData.pessoais.nome,
      usu_email: formData.contato.emailCorporativo.trim(),
      usu_cpf: sanitizeNumber(formData.pessoais.cpf),
      usu_telefone: sanitizeNumber(formData.contato.celular),
      usu_departamento: formData.trabalho.departamento,
      usu_permissao: formData.acesso.perfil,
      usu_senha: formData.acesso.senha,
      usu_foto_base64: formData.fotoBase64 || null
    };

    return { usuario: usuarioCadastro, jornada, extras, preferencias };
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      setCurrentStep(4);
      return;
    }
    setSubmitting(true);
    try {
      const payload = buildPayload();
      const resposta = isEditing && editingId
        ? await editarUsuario(editingId, payload)
        : await cadastrarUsuarioCompleto(payload);
      Alert.alert('Sucesso', resposta.mensagem || (isEditing ? 'Colaborador atualizado com sucesso!' : 'Colaborador cadastrado com sucesso!'), [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Erro ao salvar', error.message || 'Não foi possível concluir a operação.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderDadosPessoais = () => (
    <View>
      <Text style={styles.sectionTitle}>Dados Básicos</Text>
      <View style={[styles.formGrid, isCompact && styles.formGridStack]}>
        <View style={[styles.formGroup, isCompact && styles.formGroupFullWidth]}>
          <Text style={styles.label}>Nome completo</Text>
          <TextInput style={styles.input} value={formData.pessoais.nome} onChangeText={(value) => updateSection('pessoais', 'nome', value)} />
          {errors.nome && <Text style={styles.errorText}>{errors.nome}</Text>}
        </View>
        <View style={[styles.formGroup, isCompact && styles.formGroupFullWidth]}>
          <Text style={styles.label}>Nome social (opcional)</Text>
          <TextInput style={styles.input} value={formData.pessoais.nomeSocial} onChangeText={(value) => updateSection('pessoais', 'nomeSocial', value)} />
        </View>
        <View style={[styles.formGroup, isCompact && styles.formGroupFullWidth]}>
          <Text style={styles.label}>CPF</Text>
          <TextInput
            style={styles.input}
            value={formData.pessoais.cpf}
            onChangeText={(value) => updateSection('pessoais', 'cpf', formatarCPF(value))}
            keyboardType="numeric"
            maxLength={14}
          />
          {errors.cpf && <Text style={styles.errorText}>{errors.cpf}</Text>}
        </View>
        <View style={[styles.formGroup, isCompact && styles.formGroupFullWidth]}>
          <Text style={styles.label}>Data de nascimento (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={formData.pessoais.nascimento}
            onChangeText={(value) => updateSection('pessoais', 'nascimento', value)}
          />
        </View>
      </View>
      <Text style={styles.sectionTitle}>Contato e Endereço</Text>
      <View style={[styles.formGrid, isCompact && styles.formGridStack]}>
        <View style={[styles.formGroup, isCompact && styles.formGroupFullWidth]}>
          <Text style={styles.label}>Email corporativo</Text>
          <TextInput
            style={styles.input}
            value={formData.contato.emailCorporativo}
            onChangeText={(value) => updateSection('contato', 'emailCorporativo', value.trim())}
            keyboardType="email-address"
          />
          {errors.emailCorporativo && <Text style={styles.errorText}>{errors.emailCorporativo}</Text>}
        </View>
        <View style={[styles.formGroup, isCompact && styles.formGroupFullWidth]}>
          <Text style={styles.label}>Email pessoal (opcional)</Text>
          <TextInput
            style={styles.input}
            value={formData.contato.emailPessoal}
            onChangeText={(value) => updateSection('contato', 'emailPessoal', value)}
            keyboardType="email-address"
          />
        </View>
        <View style={[styles.formGroup, isCompact && styles.formGroupFullWidth]}>
          <Text style={styles.label}>Celular</Text>
          <TextInput
            style={styles.input}
            value={formData.contato.celular}
            onChangeText={(value) => updateSection('contato', 'celular', formatarCelular(value))}
            keyboardType="phone-pad"
            maxLength={15}
          />
          {errors.celular && <Text style={styles.errorText}>{errors.celular}</Text>}
        </View>
        <View style={[styles.formGroup, isCompact && styles.formGroupFullWidth]}>
          <Text style={styles.label}>CEP (opcional)</Text>
          <TextInput style={styles.input} value={formData.contato.cep} onChangeText={(value) => updateSection('contato', 'cep', formatarCEP(value))} keyboardType="numeric" maxLength={9} />
        </View>
        <View style={[styles.formGroup, isCompact && styles.formGroupFullWidth]}>
          <Text style={styles.label}>Logradouro (opcional)</Text>
          <TextInput style={styles.input} value={formData.contato.logradouro} onChangeText={(value) => updateSection('contato', 'logradouro', value)} />
        </View>
        <View style={[styles.formGroup, isCompact && styles.formGroupFullWidth]}>
          <Text style={styles.label}>Número (opcional)</Text>
          <TextInput style={styles.input} value={formData.contato.numero} onChangeText={(value) => updateSection('contato', 'numero', value)} />
        </View>
      </View>
    </View>
  );

  const renderDadosTrabalhistas = () => (
    <View>
      <Text style={styles.sectionTitle}>Vínculo com a empresa</Text>
      <View style={[styles.formGroup, styles.formGroupFullWidth]}>
        <Text style={styles.label}>Nome da empresa (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite o nome ou razão social"
          value={formData.trabalho.empresaNome}
          onChangeText={(value) => updateSection('trabalho', 'empresaNome', value)}
        />
        {options.empresas.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {options.empresas.map((empresa) => {
              const active = formData.trabalho.empresaNome === empresa.nome;
              return (
                <TouchableOpacity
                  key={empresa.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => updateSection('trabalho', 'empresaNome', empresa.nome)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{empresa.nome}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
        {options.empresas.length > 0 && (
          <Text style={styles.helperText}>Toque em uma sugestão ou digite o nome exatamente como deseja salvar.</Text>
        )}
      </View>
      <View style={[styles.formGrid, isCompact && styles.formGridStack]}>
        <View style={[styles.formGroup, isCompact && styles.formGroupFullWidth]}>
          <Text style={styles.label}>Departamento</Text>
          <TextInput style={styles.input} value={formData.trabalho.departamento} onChangeText={(value) => updateSection('trabalho', 'departamento', value)} />
          {errors.departamento && <Text style={styles.errorText}>{errors.departamento}</Text>}
        </View>
        <View style={[styles.formGroup, isCompact && styles.formGroupFullWidth]}>
          <Text style={styles.label}>Cargo</Text>
          <TextInput style={styles.input} value={formData.trabalho.cargo} onChangeText={(value) => updateSection('trabalho', 'cargo', value)} />
          {errors.cargo && <Text style={styles.errorText}>{errors.cargo}</Text>}
        </View>
        <View style={[styles.formGroup, isCompact && styles.formGroupFullWidth]}>
          <Text style={styles.label}>Data de admissão (opcional)</Text>
          <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={formData.trabalho.dataAdmissao} onChangeText={(value) => updateSection('trabalho', 'dataAdmissao', value)} />
        </View>
      </View>
    </View>
  );

  const renderConfigPonto = () => (
    <View>
      <Text style={styles.sectionTitle}>Jornada e políticas de ponto</Text>
      <View style={[styles.card, isCompact && styles.cardCompact]}>
        <Text style={styles.label}>Jornada padrão</Text>
        {options.jornadas.length === 0 ? (
          <Text style={styles.helperText}>Cadastre uma jornada antes de vincular usuários.</Text>
        ) : (
          options.jornadas.map((jornada) => {
            const active = formData.configPonto.jornadaId === jornada.cad_id;
            return (
              <TouchableOpacity key={jornada.cad_id} style={[styles.jornadaItem, active && styles.jornadaItemActive]} onPress={() => updateSection('configPonto', 'jornadaId', jornada.cad_id)}>
                <View>
                  <Text style={styles.jornadaTitle}>{jornada.nome}</Text>
                  <Text style={styles.jornadaSubtitle}>{jornada.tipo || 'Sem descrição'} · {jornada.inicio} - {jornada.fim}</Text>
                </View>
                <Text style={styles.jornadaCheck}>{active ? 'Selecionado' : 'Selecionar'}</Text>
              </TouchableOpacity>
            );
          })
        )}
        {errors.jornadaId && <Text style={styles.errorText}>{errors.jornadaId}</Text>}
      </View>
    </View>
  );

  const renderBiometriaEAcesso = () => (
    <View>
      <Text style={styles.sectionTitle}>Acesso ao sistema</Text>
      <View style={[styles.formGrid, isCompact && styles.formGridStack]}>
        <View style={[styles.formGroup, isCompact && styles.formGroupFullWidth]}>
          <Text style={styles.label}>Login</Text>
          <TextInput style={styles.input} value={formData.acesso.login} onChangeText={(value) => updateSection('acesso', 'login', value.trim())} autoCapitalize="none" />
          {errors.login && <Text style={styles.errorText}>{errors.login}</Text>}
        </View>
        <View style={[styles.formGroup, isCompact && styles.formGroupFullWidth]}>
          <Text style={styles.label}>Senha temporária</Text>
          <TextInput style={styles.input} secureTextEntry value={formData.acesso.senha} onChangeText={(value) => updateSection('acesso', 'senha', value)} />
          {errors.senha && <Text style={styles.errorText}>{errors.senha}</Text>}
        </View>
      </View>
      <Text style={styles.label}>Perfil de acesso</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {PERFIS_FIXOS.map((perfil) => {
          const active = formData.acesso.perfil === perfil;
          return (
            <TouchableOpacity key={perfil} style={[styles.chip, active && styles.chipActive]} onPress={() => updateSection('acesso', 'perfil', perfil)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{perfil}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Foto e biometria facial</Text>
      <Text style={styles.helperText}>Capture ou envie uma foto nítida com o colaborador centralizado. A imagem será analisada automaticamente.</Text>
      <View style={[styles.photoActionsRow, isCompact && styles.photoActionsColumn]}>
        <TouchableOpacity style={[styles.photoButton, styles.photoButtonPrimary, isCompact && styles.photoButtonFullWidth]} onPress={() => selecionarFoto('camera')}>
          <Text style={styles.photoButtonText}>Capturar foto</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.photoButton, styles.photoButtonSecondary, isCompact && styles.photoButtonFullWidth, isCompact && styles.photoButtonLastCompact]}
          onPress={() => selecionarFoto('galeria')}
        >
          <Text style={styles.photoButtonTextSecondary}>Escolher da galeria</Text>
        </TouchableOpacity>
      </View>
      {analisandoFoto && (
        <View style={styles.photoFeedback}>
          <ActivityIndicator color="#21808d" />
          <Text style={styles.photoFeedbackText}>Analisando rosto...</Text>
        </View>
      )}
      {fotoPreview ? (
        <Image source={{ uri: fotoPreview }} style={styles.fotoPreview} resizeMode="cover" />
      ) : (
        <View style={[styles.fotoPlaceholder, fotoErro && styles.fotoPlaceholderError]}>
          <Text style={styles.helperText}>Nenhuma foto enviada ainda.</Text>
        </View>
      )}
      <Text style={styles.helperText}>{fotoStatus}</Text>
      {fotoErro ? <Text style={styles.errorText}>{fotoErro}</Text> : null}
    </View>
  );

  const renderDocumentos = () => (
    <View>
      <Text style={styles.sectionTitle}>Observações gerais (opcional)</Text>
      <Text style={styles.helperText}>Registre orientações específicas, pendências ou qualquer anotação que deva acompanhar o cadastro.</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Informações adicionais para o RH"
        multiline
        value={formData.observacoes}
        onChangeText={(value) => setFormData((prev) => ({ ...prev, observacoes: value }))}
      />
    </View>
  );

  const renderResumo = () => (
    <View>
      <Text style={styles.sectionTitle}>Resumo antes de salvar</Text>
      <View style={[styles.card, isCompact && styles.cardCompact]}>
        <Text style={styles.summaryTitle}>Dados pessoais</Text>
        <Text style={styles.summaryItem}>Nome: {formData.pessoais.nome || '-'}</Text>
        <Text style={styles.summaryItem}>CPF: {formData.pessoais.cpf || '-'}</Text>
        <Text style={styles.summaryItem}>Celular: {formData.contato.celular || '-'}</Text>
      </View>
      <View style={[styles.card, isCompact && styles.cardCompact]}>
        <Text style={styles.summaryTitle}>Trabalho e jornada</Text>
        <Text style={styles.summaryItem}>Departamento: {formData.trabalho.departamento || '-'}</Text>
        <Text style={styles.summaryItem}>Cargo: {formData.trabalho.cargo || '-'}</Text>
        <Text style={styles.summaryItem}>
          Jornada: {options.jornadas.find((j) => j.cad_id === formData.configPonto.jornadaId)?.nome || 'Não vinculada'}
        </Text>
      </View>
      <View style={[styles.card, isCompact && styles.cardCompact]}>
        <Text style={styles.summaryTitle}>Acesso</Text>
        <Text style={styles.summaryItem}>Login: {formData.acesso.login || '-'}</Text>
        <Text style={styles.summaryItem}>Perfil: {formData.acesso.perfil}</Text>
        <Text style={styles.summaryItem}>Biometria facial: {formData.fotoBase64 ? 'Foto analisada' : 'Não enviada'}</Text>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderDadosPessoais();
      case 2:
        return renderDadosTrabalhistas();
      case 3:
        return renderConfigPonto();
      case 4:
        return renderBiometriaEAcesso();
      case 5:
        return renderDocumentos();
      case 6:
      default:
        return renderResumo();
    }
  };

  if (loadingOptions || (isEditing && loadingUsuario)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#21808d" />
        <Text style={styles.loadingText}>
          {loadingOptions ? 'Carregando opções...' : 'Carregando dados do colaborador...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.container, isCompact && styles.containerCompact]}>
        <Text style={styles.title}>{isEditing ? 'Editar colaborador' : 'Cadastro completo de colaborador'}</Text>
        <View style={[styles.stepSummaryRow, isCompact && styles.stepSummaryRowCompact]}>
          <Text style={styles.stepSummaryIndicator}>{`Etapa ${currentStep} de ${STEPS.length}`}</Text>
          <Text style={styles.stepSummaryTitle}>{currentStepMeta?.titulo}</Text>
        </View>
        <View style={[styles.card, isCompact && styles.cardCompact]}>{renderStepContent()}</View>
      </ScrollView>
      <View style={[styles.footer, isCompact && styles.footerStack]}>
        <TouchableOpacity
          style={[styles.footerButton, styles.footerButtonSecondary, currentStep === 1 && styles.footerButtonDisabled, isCompact && styles.footerButtonFullWidth]}
          onPress={handlePrev}
          disabled={currentStep === 1 || submitting}
        >
          <Text style={[styles.footerButtonText, styles.footerButtonTextSecondary, currentStep === 1 && styles.footerButtonTextDisabled]}>Voltar</Text>
        </TouchableOpacity>
        {currentStep < STEPS.length ? (
          <TouchableOpacity
            style={[styles.footerButton, styles.footerButtonPrimary, isCompact && styles.footerButtonFullWidth, isCompact && styles.footerButtonLastCompact]}
            onPress={handleNext}
            disabled={submitting}
          >
            <Text style={styles.footerButtonText}>Avançar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.footerButton, styles.footerButtonPrimary, isCompact && styles.footerButtonFullWidth, isCompact && styles.footerButtonLastCompact]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.footerButtonText}>{isEditing ? 'Atualizar colaborador' : 'Salvar colaborador'}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7f5' },
  container: { paddingBottom: 140, paddingHorizontal: 20 },
  containerCompact: { paddingHorizontal: 16 },
  title: { fontSize: 22, fontWeight: '700', marginVertical: 16, textAlign: 'center', color: '#13343b' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, borderWidth: 1, borderColor: 'rgba(19,52,59,0.08)' },
  cardCompact: { padding: 16 },
  stepSummaryRow: { marginBottom: 12, backgroundColor: '#f1f5f9', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 },
  stepSummaryRowCompact: { alignItems: 'flex-start' },
  stepSummaryIndicator: { color: '#21808d', fontWeight: '700', fontSize: 13 },
  stepSummaryTitle: { color: '#13343b', fontWeight: '600', fontSize: 16, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#13343b', marginBottom: 12 },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  formGridStack: { flexDirection: 'column' },
  formGroup: { width: '48%', marginBottom: 16 },
  formGroupFullWidth: { width: '100%' },
  label: { fontSize: 14, fontWeight: '600', color: '#13343b', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#d3d6d8', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, backgroundColor: '#fff' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  errorText: { color: '#c0152f', marginTop: 4, fontSize: 12 },
  helperText: { fontSize: 13, color: '#626c71' },
  chipRow: { flexDirection: 'row', marginVertical: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#d3d6d8', marginRight: 8 },
  chipActive: { backgroundColor: '#21808d', borderColor: '#21808d' },
  chipText: { color: '#13343b', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  jornadaItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#efefef', flexDirection: 'row', justifyContent: 'space-between' },
  jornadaItemActive: { backgroundColor: '#f0fbfc', borderRadius: 12, paddingHorizontal: 12 },
  jornadaTitle: { fontWeight: '600', color: '#13343b' },
  jornadaSubtitle: { color: '#626c71', fontSize: 12 },
  jornadaCheck: { color: '#21808d', fontWeight: '600' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  toggleLabel: { fontSize: 15, color: '#13343b', flex: 1, marginRight: 16 },
  photoActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 12 },
  photoActionsColumn: { flexDirection: 'column' },
  photoButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginHorizontal: 4 },
  photoButtonFullWidth: { flex: undefined, width: '100%', marginHorizontal: 0, marginBottom: 8 },
  photoButtonLastCompact: { marginBottom: 0 },
  photoButtonPrimary: { backgroundColor: '#21808d' },
  photoButtonSecondary: { borderWidth: 1, borderColor: '#21808d', backgroundColor: '#fff' },
  photoButtonText: { color: '#fff', fontWeight: '600' },
  photoButtonTextSecondary: { color: '#21808d', fontWeight: '600' },
  fotoPreview: { width: '100%', height: 220, borderRadius: 16, marginBottom: 8 },
  fotoPlaceholder: { height: 220, borderWidth: 1, borderColor: '#d3d6d8', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  fotoPlaceholderError: { borderColor: '#c0152f' },
  photoFeedback: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  photoFeedbackText: { marginLeft: 8, color: '#626c71' },
  summaryTitle: { fontSize: 16, fontWeight: '600', color: '#13343b', marginBottom: 8 },
  summaryItem: { fontSize: 14, color: '#3a4449', marginBottom: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#dfe3e5' },
  footerStack: { flexDirection: 'column' },
  footerButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginHorizontal: 6 },
  footerButtonFullWidth: { flex: undefined, width: '100%', marginHorizontal: 0, marginBottom: 12 },
  footerButtonLastCompact: { marginBottom: 0 },
  footerButtonPrimary: { backgroundColor: '#21808d' },
  footerButtonSecondary: { borderWidth: 1, borderColor: '#d3d6d8' },
  footerButtonDisabled: { opacity: 0.4 },
  footerButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  footerButtonTextSecondary: { color: '#13343b' },
  footerButtonTextDisabled: { color: '#9aa1a4' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#626c71' }
});