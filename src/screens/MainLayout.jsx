import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Animated, Easing } from 'react-native';
import { colors } from '../theme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';


const SCREEN_ANIMATION = {
    duration: 220,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
};

export default function MainLayout({ children }) {
    const [menuVisivel, setMenuVisivel] = useState(false);
    const [usuariosMenuVisivel, setUsuariosMenuVisivel] = useState(false);
    const navigation = useNavigation();
    const { usuario } = useAuth();
    const contentOpacity = useRef(new Animated.Value(0)).current;
    const contentTranslate = useRef(new Animated.Value(18)).current;
    const menuOpacity = useRef(new Animated.Value(0)).current;
    const menuScale = useRef(new Animated.Value(0.92)).current;

    const animateScreen = useCallback(() => {
        contentOpacity.setValue(0);
        contentTranslate.setValue(18);
        Animated.parallel([
            Animated.timing(contentOpacity, { toValue: 1, ...SCREEN_ANIMATION }),
            Animated.timing(contentTranslate, { toValue: 0, ...SCREEN_ANIMATION })
        ]).start();
    }, [contentOpacity, contentTranslate]);

    useFocusEffect(
        useCallback(() => {
            animateScreen();
        }, [animateScreen])
    );

    useEffect(() => {
        if (!menuVisivel) return;
        menuOpacity.setValue(0);
        menuScale.setValue(0.92);
        Animated.parallel([
            Animated.timing(menuOpacity, { toValue: 1, ...SCREEN_ANIMATION }),
            Animated.timing(menuScale, { toValue: 1, ...SCREEN_ANIMATION })
        ]).start();
    }, [menuVisivel, menuOpacity, menuScale]);

    const toggleMainMenu = () => {
        setMenuVisivel(!menuVisivel);
        if (usuariosMenuVisivel) setUsuariosMenuVisivel(false);
    };
    
    // Função para navegar e fechar todos os menus
    const navigateAndClose = (screenName, params = {}) => {
        navigation.navigate(screenName, params);
        setMenuVisivel(false);
        setUsuariosMenuVisivel(false);
    };
    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                {/* 1. O container de conteúdo agora ocupa todo o espaço disponível, empurrando a nav para baixo */}
                <Animated.View style={[styles.content, { opacity: contentOpacity, transform: [{ translateY: contentTranslate }] }] }>
                    {children}
                </Animated.View>

                {/* 2. A barra de navegação não é mais absoluta, ela ocupa seu próprio espaço no final da tela */}
                <View style={styles.nav}>
                    <TouchableOpacity onPress={() => navigateAndClose('Calendario')}>
                        <Ionicons name="calendar" size={35} style={styles.navIcon} />
                    </TouchableOpacity>

                    {/* <TouchableOpacity onPress={toggleUsuariosMenu}> */}
                    <TouchableOpacity onPress={() => navigateAndClose('Dashboard')}>
                        <Ionicons name="home" size={35} style={styles.navIcon} />
                    </TouchableOpacity>

                    {usuario?.permissao === 'Admin' && (
                        <TouchableOpacity onPress={(toggleMainMenu)}>
                            <Ionicons name="menu" size={50} style={styles.navIcon} />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity 
                        onPress={() => {
                            if (usuario?.id) {
                                navigateAndClose('ResumoUsuario', { userId: usuario.id });
                            }
                        }}>
                        <Ionicons name="people-circle-outline" size={35} style={styles.navIcon} />
                    </TouchableOpacity>
                </View>

                {/* 3. Os menus pop-up continuam absolutos, pois eles precisam flutuar por cima de tudo */}
                {/* {usuariosMenuVisivel && (
                    <View style={styles.popupMenu}>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => navigateAndClose('TabelaUsuarios')}
                        >
                            <Text style={styles.menuTexto}>Ver Lista de Usuários</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => navigateAndClose('CadastroUsuario')}
                        >
                            <Text style={styles.menuTexto}>Adicionar Novo Usuário</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={() => setUsuariosMenuVisivel(false)}>
                            <Text style={[styles.menuTexto, { color: 'red' }]}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                )} */}
                {menuVisivel && (
                    <Animated.View style={[styles.popupMenu, { opacity: menuOpacity, transform: [{ scale: menuScale }] }] }>
                        <Text style={styles.menuTitle}>Acessos rápidos</Text>
                        <TouchableOpacity
                            style={styles.menuRow}
                            onPress={() => navigateAndClose('TabelaUsuarios')}
                        >
                            <Ionicons name="people" size={22} style={styles.menuIcon} />
                            <View>
                                <Text style={styles.menuTexto}>Usuários</Text>
                                <Text style={styles.menuSubtexto}>Listagem e cadastro</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.menuRow}
                            onPress={() => navigateAndClose('ListaPontos')}
                        >
                            <Ionicons name="briefcase" size={22} style={styles.menuIcon} />
                            <View>
                                <Text style={styles.menuTexto}>Jornadas</Text>
                                <Text style={styles.menuSubtexto}>Configuração de ponto</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.menuRow, styles.menuRowClose]} onPress={() => setMenuVisivel(false)}>
                            <Ionicons name="close" size={22} style={[styles.menuIcon, styles.menuIconClose]} />
                            <Text style={styles.menuCloseText}>Fechar</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { flex: 1 },
    nav: { height: 90, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border },
    navIcon: { color: colors.text },
    navIconSelected: { color: colors.primary },
    popupMenu: { position: 'absolute', bottom: 120, alignSelf: 'center', backgroundColor: '#fff', borderRadius: 18, paddingVertical: 16, paddingHorizontal: 20, width: '88%', maxWidth: 360, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, zIndex: 20, borderWidth: 1, borderColor: colors.border },
    menuTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderRadius: 12, marginBottom: 8, backgroundColor: '#f8fafb' },
    menuRowClose: { backgroundColor: '#fdeef0', justifyContent: 'center' },
    menuIcon: { color: colors.primary, marginRight: 12 },
    menuIconClose: { color: '#c0152f', marginRight: 8 },
    menuTexto: { fontSize: 16, fontWeight: '600', color: colors.text },
    menuSubtexto: { fontSize: 12, color: colors.muted, marginTop: 2 },
    menuCloseText: { fontSize: 16, fontWeight: '700', color: '#c0152f' },
});
