import { LocaleConfig } from 'react-native-calendars';

// Configuração do idioma Português (Brasil)
LocaleConfig.locales['br'] = {
    monthNames: [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ],
    monthNamesShort: [
        'Jan.', 'Fev.', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul.', 'Ago', 'Set.', 'Out.', 'Nov.', 'Dez.'
    ],
    dayNames: [
        'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
    ],
    dayNamesShort: [
        'Dom.', 'Seg.', 'Ter.', 'Qua.', 'Qui.', 'Sex.', 'Sáb.'
    ],
    today: "Hoje"
};

// Define o padrão para BR
LocaleConfig.defaultLocale = 'br';