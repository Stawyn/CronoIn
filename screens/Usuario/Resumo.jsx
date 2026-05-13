// src/screens/Usuario/Resumo.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { buscarUsuarioPorId } from '../../services/UsuarioService';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';

export default function ResumoUsuarioScreen({ route, navigation }) {
    const routeUserId = route?.params?.userId;
    const { usuario: usuarioLogado } = useAuth();
    const resolvedUserId = routeUserId ?? usuarioLogado?.id;

    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const carregarUsuario = async () => {
            if (!resolvedUserId) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const usuarioEncontrado = await buscarUsuarioPorId(resolvedUserId);
                setUsuario(usuarioEncontrado);
            } catch (error) {
                Alert.alert("Erro", "Não foi possível carregar os detalhes do usuário.");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        carregarUsuario();
    }, [resolvedUserId]);

    const perfilIncompleto = !resolvedUserId;

    const initials = useMemo(() => {
        if (!usuario?.usu_nome) return '??';
        return usuario.usu_nome
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((parte) => parte[0]?.toUpperCase())
            .join('');
    }, [usuario?.usu_nome]);

    const contatoCards = useMemo(() => ([
        { label: 'E-mail institucional', value: usuario?.usu_email, icon: 'mail-outline' },
        { label: 'Telefone', value: usuario?.usu_telefone, icon: 'call-outline' },
    ]), [usuario?.usu_email, usuario?.usu_telefone]);

    const organizacaoCards = useMemo(() => ([
        { label: 'Departamento', value: usuario?.usu_departamento, icon: 'business-outline' },
        { label: 'Permissão', value: usuario?.usu_permissao, icon: 'shield-checkmark-outline' },
    ]), [usuario?.usu_departamento, usuario?.usu_permissao]);

    if (loading) {
        return <ActivityIndicator size="large" color="#2E8B57" style={{ flex: 1, justifyContent: 'center' }} />;
    }

    if (perfilIncompleto) {
        return (
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollCentered}>
                    <View style={styles.emptyState}>
                        <Ionicons name="person-circle-outline" size={64} color={colors.muted} />
                        <Text style={styles.emptyTitle}>Nenhum usuário ativo</Text>
                        <Text style={styles.emptySubtitle}>Faça login novamente para visualizar o perfil.</Text>
                        <TouchableOpacity style={styles.botaoVoltar} onPress={() => navigation.goBack()}>
                            <Text style={styles.textoBotao}>Voltar</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    if (!usuario) {
        return <View style={styles.container}><Text>Usuário não encontrado.</Text></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.titulo}>Perfil do Usuário</Text>

                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileHint}>Você está logado como</Text>
                        <Text style={styles.profileName}>{usuario.usu_nome}</Text>
                        <Text style={styles.profileEmail}>{usuario.usu_email}</Text>
                    </View>
                    <View style={[styles.statusPill, usuario.usu_ativo ? styles.statusPillActive : styles.statusPillInactive]}>
                        <Ionicons
                            name={usuario.usu_ativo ? 'checkmark-circle-outline' : 'close-circle-outline'}
                            size={18}
                            color={usuario.usu_ativo ? colors.success : colors.danger}
                        />
                        <Text style={styles.statusText}>{usuario.usu_ativo ? 'Ativo' : 'Inativo'}</Text>
                    </View>
                </View>

                <View style={styles.cardSection}>
                    <Text style={styles.sectionTitle}>Documentos</Text>
                    <View style={styles.detailRow}>
                        <Ionicons name="id-card-outline" size={20} color={colors.primary} style={styles.detailIcon} />
                        <View>
                            <Text style={styles.detailLabel}>CPF</Text>
                            <Text style={styles.detailValue}>{usuario.usu_cpf || 'Não informado'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.cardSection}>
                    <Text style={styles.sectionTitle}>Contato</Text>
                    {contatoCards.map((item) => (
                        <View style={styles.detailRow} key={item.label}>
                            <Ionicons name={item.icon} size={20} color={colors.primary} style={styles.detailIcon} />
                            <View>
                                <Text style={styles.detailLabel}>{item.label}</Text>
                                <Text style={styles.detailValue}>{item.value || 'Não informado'}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.cardSection}>
                    <Text style={styles.sectionTitle}>Organização</Text>
                    {organizacaoCards.map((item) => (
                        <View style={styles.detailRow} key={item.label}>
                            <Ionicons name={item.icon} size={20} color={colors.primary} style={styles.detailIcon} />
                            <View>
                                <Text style={styles.detailLabel}>{item.label}</Text>
                                <Text style={styles.detailValue}>{item.value || 'Não informado'}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <TouchableOpacity style={styles.botaoVoltar} onPress={() => navigation.goBack()}>
                    <Text style={styles.textoBotao}>Voltar</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scrollContent: { padding: 20, paddingBottom: 40 },
    scrollCentered: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    titulo: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: colors.text },
    profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4, marginBottom: 18 },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E9F1FF', alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 24, fontWeight: '700', color: colors.primary },
    profileInfo: { flex: 1, marginLeft: 16 },
    profileHint: { color: colors.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    profileName: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 4 },
    profileEmail: { fontSize: 14, color: colors.muted, marginTop: 4 },
    statusPill: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
    statusPillActive: { borderColor: colors.success, backgroundColor: '#E7F7EE' },
    statusPillInactive: { borderColor: colors.danger, backgroundColor: '#FDECEE' },
    statusText: { marginLeft: 6, fontWeight: '600', color: colors.text },
    cardSection: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
    detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
    detailIcon: { marginRight: 12 },
    detailLabel: { fontSize: 13, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
    detailValue: { fontSize: 16, color: colors.text, marginTop: 4 },
    botaoVoltar: { backgroundColor: colors.primary, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    textoBotao: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16, color: colors.text },
    emptySubtitle: { fontSize: 14, color: colors.muted, marginTop: 6, textAlign: 'center' },
});