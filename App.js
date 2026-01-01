import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { Platform, Image, View, Text } from 'react-native';

// Android Fabric can throw when measureText runs after a surface unmounts (e.g. portals/modals).
// Wrap the native call so we log and gracefully return zero sizes instead of crashing the app.
if (
  Platform.OS === 'android' &&
  global?.nativeFabricUIManager?.measureText &&
  !global.__cronoinSafeMeasureTextPatched
) {
  const originalMeasureText = global.nativeFabricUIManager.measureText.bind(global.nativeFabricUIManager);
  global.nativeFabricUIManager.measureText = (...args) => {
    try {
      return originalMeasureText(...args);
    } catch (error) {
      console.warn('[measureText] fallback triggered:', error?.message || error);
      return { width: 0, height: 0, lastLineWidth: 0, lineCount: 0 };
    }
  };
  global.__cronoinSafeMeasureTextPatched = true;
}

// Importa as telas
// Corrigindo e padronizando os caminhos de importação a partir da raiz do projeto
import Dashboard from './src/screens/Dashboard';
import ListaPontos from './src/screens/Ponto'; // O bundler resolve 'index.jsx' automaticamente
import CadastroPonto from './src/screens/Ponto/Cadastro'; // Caminho explícito para o arquivo Cadastro.jsx
import ResumoPonto from './src/screens/Ponto/ResumoPonto';
import ClockInFlowScreen from './src/screens/Ponto/ClockInFlow';
import FacialDebugScreen from './src/screens/Ponto/FacialDebug';
import MainLayout from './src/screens/MainLayout';
import CadastroScreen from './src/screens/Usuario/Cadastro';
import TabelaUsuariosScreen from './src/screens/Usuario/index';
import ResumoUsuarioScreen from './src/screens/Usuario/Resumo';
import Calendario from './src/screens/Calendario';
import LoginScreen from './src/screens/Login';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import ResumoUsersScreen from './src/screens/Usuario/ResumoUsers';

const Stack = createNativeStackNavigator();

const withMainLayout = (ScreenComp) => (props) => (
  <MainLayout>
    <ScreenComp {...props} />
  </MainLayout>
);

function LogoHeader({ title }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {/* Certifique-se de que o caminho para a imagem está correto */}
      {/* Se o App.js está na raiz, o caminho é './assets/CronoIn_Logo.png' */}
      <Image
        style={{ width: 50, height: 40, marginRight: 10 }}
        source={require('./assets/CronoIn_Logo.png')} 
        resizeMode="contain"
      />
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>{title}</Text>
    </View>
  );
}

function PrivateStack() {
  return (
    <Stack.Navigator initialRouteName="Dashboard">
      <Stack.Screen 
          name="Dashboard" 
          component={withMainLayout(Dashboard)} 
          options={{ headerTitle: () => <LogoHeader title="Dashboard"/> }}
        />
        <Stack.Screen 
          name="ListaPontos" 
          component={withMainLayout(ListaPontos)} 
          options={{ headerTitle: () => <LogoHeader title='Gerenciar Jornadas'/> }} // Título mais descritivo
        />
        <Stack.Screen 
          name="CadastroPonto" // Este nome DEVE ser o mesmo usado no navigation.navigate()
          component={withMainLayout(CadastroPonto)} 
          options={{ headerTitle: () => <LogoHeader title='Cadastro de Jornada'/> }}
        />
        <Stack.Screen
          name="ResumoPonto"
          component={withMainLayout(ResumoPonto)}
          options={{ headerTitle: () => <LogoHeader title='Resumo da Jornada'/> }}
        />
        <Stack.Screen 
          name="CadastroUsuario" 
          component={withMainLayout(CadastroScreen)} 
          options={{ headerTitle: () => <LogoHeader title='Cadastro de Usuário'/> }}
        />
        <Stack.Screen 
          name="TabelaUsuarios" 
          component={withMainLayout(TabelaUsuariosScreen)} 
          options={{ headerTitle: () => <LogoHeader title='Gerenciar Usuários'/> }}
        />
        <Stack.Screen 
          name="ResumoUsuario" 
          component={withMainLayout(ResumoUsuarioScreen)} 
          options={{ headerTitle: () => <LogoHeader title='Perfil do Usuário'/> }}
        />
        <Stack.Screen 
          name="ResumoUsers"
          component={withMainLayout(ResumoUsersScreen)}
          options={{ title: 'Resumo do Usuário' }}
        />
        <Stack.Screen
          name="Calendario"
          component={withMainLayout(Calendario)}
          options={{ headerTitle: () => <LogoHeader title='Calendario'/> }}
        />
        <Stack.Screen
          name="ClockInFlow"
          component={ClockInFlowScreen}
          options={{ headerTitle: () => <LogoHeader title='Registrar Ponto'/>,
             presentation:'modal'
          }}
        />
        <Stack.Screen
          name="FacialDebug"
          component={withMainLayout(FacialDebugScreen)}
          options={{ headerTitle: () => <LogoHeader title='Laboratório Facial'/> }}
        />
      </Stack.Navigator>
  );
}

function PublicStack() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Entrar' }} />
    </Stack.Navigator>
  );
}

function AppNavigation() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <PrivateStack/> : <PublicStack/>;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AuthProvider>
          <NavigationContainer>
            <AppNavigation/>
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
