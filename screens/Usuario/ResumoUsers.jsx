// src/screens/Usuario/ResumoUsers.jsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { listarPontos } from '../../services/PontoService';

export default function ResumoUsersScreen({ route, navigation }) {
    const usuario = route?.params?.usuario;

    const [nomeJornada, setNomeJornada] = React.useState('-');

    React.useEffect(() => {
        const carregarJornada = async () => {
            try {
                const jornadaId =
                    usuario?.extras?.config_ponto?.jornadaId ||
                    usuario?.usu_jornada_padrao_id;

                if (!jornadaId) return;

                const jornadas = await listarPontos();
                const jornada = jornadas.find(j => j.cad_id === jornadaId);

                if (jornada) {
                    setNomeJornada(jornada.cad_ponto_nome);
                }
            } catch (error) {
                console.log("Erro ao carregar jornada:", error);
            }
        };

        carregarJornada();
    }, [usuario]);

    if (!usuario) {
        return (
            <View style={styles.center}>
                <Text style={styles.error}>Usuário não encontrado.</Text>
                <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
                    <Text style={styles.btnText}>Voltar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const fotoUrl = usuario.usu_foto_url ? usuario.usu_foto_url : null;

    const initials = usuario.usu_nome
        ?.split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('');

    const extras = usuario.extras || {};

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Resumo Completo do Usuário</Text>

            {/* FOTO + STATUS */}
            <View style={styles.card}>
                {fotoUrl ? (
                    <Image source={{ uri: fotoUrl }} style={styles.avatar} />
                ) : (
                    <View style={styles.placeholder}>
                        <Text style={styles.initials}>{initials}</Text>
                    </View>
                )}
                <Text style={styles.name}>{usuario.usu_nome}</Text>
                <Text style={styles.email}>{usuario.usu_email}</Text>

                <View style={[styles.status, usuario.usu_ativo ? styles.active : styles.inactive]}>
                    <Ionicons
                        name={usuario.usu_ativo ? 'checkmark-circle' : 'close-circle'}
                        size={18}
                        color={usuario.usu_ativo ? colors.success : colors.danger}
                    />
                    <Text style={styles.statusText}>
                        {usuario.usu_ativo ? 'Ativo' : 'Inativo'}
                    </Text>
                </View>
            </View>

            {/* DOCUMENTOS */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Documentos</Text>
                <Text style={styles.item}>CPF: {usuario.usu_cpf || 'Não informado'}</Text>
            </View>

            {/* CONTATO */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contato</Text>

                <Text style={styles.item}>
                    Email corporativo: {usuario.usu_email || '-'}
                </Text>

                <Text style={styles.item}>
                    Email pessoal: {extras?.dados_pessoais?.contato?.emailPessoal || '-'}
                </Text>

                <Text style={styles.item}>
                    Telefone: {usuario.usu_telefone || '-'}
                </Text>
            </View>

            {/* ORGANIZAÇÃO */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Organização</Text>
                <Text style={styles.item}>Departamento: {usuario.usu_departamento || '-'}</Text>
                <Text style={styles.item}>Permissão: {usuario.usu_permissao || '-'}</Text>
            </View>

            {/* JORNADA */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Configuração de Ponto</Text>

                <Text style={styles.item}>
                    Jornada vinculada: {nomeJornada}
                </Text>
            </View>

            {/* DADOS PESSOAIS */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dados Pessoais</Text>
                <Text style={styles.item}>Nome social: {extras?.dados_pessoais?.nomeSocial || '-'}</Text>
                <Text style={styles.item}>Nascimento: {extras?.dados_pessoais?.nascimento || '-'}</Text>
            </View>

            {/* ENDEREÇO */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Endereço</Text>

                <Text style={styles.item}>
                    Logradouro: {extras?.dados_pessoais?.contato?.logradouro || '-'}
                </Text>

                <Text style={styles.item}>
                    CEP: {extras?.dados_pessoais?.contato?.cep || '-'}
                </Text>

                <Text style={styles.item}>
                    Número: {extras?.dados_pessoais?.contato?.numero || '-'}
                </Text>
            </View>

            {/* BIOMETRIA */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Biometria</Text>
                <Text style={styles.item}>
                    Foto enviada: {usuario.usu_foto_url ? 'Sim' : 'Não'}
                </Text>
            </View>

            {/* OBSERVAÇÕES */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Observações</Text>
                <Text style={styles.item}>{usuario.preferencias?.observacoes || '-'}</Text>
            </View>

            <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
                <Text style={styles.btnText}>Voltar</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, padding: 20 },
    title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 20, color: colors.text },
    card: { backgroundColor: '#fff', padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 16 },
    avatar: { width: 120, height: 120, borderRadius: 16, marginBottom: 12 },
    placeholder: { width: 120, height: 120, borderRadius: 16, backgroundColor: '#dde8ff', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    initials: { fontSize: 42, fontWeight: '700', color: colors.primary },
    name: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 6 },
    email: { color: colors.muted, marginBottom: 6 },
    status: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, marginTop: 8, alignItems: 'center', borderWidth: 1 },
    active: { backgroundColor: '#eafaf1', borderColor: colors.success },
    inactive: { backgroundColor: '#fdebec', borderColor: colors.danger },
    statusText: { marginLeft: 6, fontWeight: '600', color: colors.text },
    section: { backgroundColor: '#fff', padding: 16, borderRadius: 14, marginBottom: 14 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, color: colors.text },
    item: { fontSize: 15, marginBottom: 6, color: colors.text },
    btn: { backgroundColor: colors.primary, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    btnText: { color: '#fff', fontWeight: '700' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    error: { fontSize: 18, color: colors.danger, marginBottom: 20 }
});
