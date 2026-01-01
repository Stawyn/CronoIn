# Manual do Usuário

<img width="714" height="349" alt="CronoIn_Logo" src="https://github.com/user-attachments/assets/633a7c1d-284b-4f35-bf2b-b6ce41190650" />


> Versão 1.0 · Atualizado em 15/11/2025 · Válido para web app (Next/Expo) integrado ao backend FastAPI

## Índice
1. [Introdução](#1-introdução)
2. [Primeiros Passos](#2-primeiros-passos)
   - [2.1 Como Acessar o Sistema](#21-como-acessar-o-sistema)
   - [2.2 Criando sua Conta](#22-criando-sua-conta)
   - [2.3 Primeiro Login](#23-primeiro-login)
   - [2.4 Conhecendo a Interface](#24-conhecendo-a-interface)
3. [Funcionalidades Principais](#3-funcionalidades-principais)
4. [Casos de Uso Comuns](#4-casos-de-uso-comuns)
5. [Perfis e Permissões](#5-perfis-e-permissões)
6. [Configurações e Personalização](#6-configurações-e-personalização)
7. [Recursos Avançados](#7-recursos-avançados)
8. [Trabalhando com Dados](#8-trabalhando-com-dados)
9. [Relatórios e Dashboards](#9-relatórios-e-dashboards)
10. [Integrações](#10-integrações)
11. [Uso em Dispositivos Móveis](#11-mobile)
12. [Solução de Problemas (FAQ)](#12-solução-de-problemas-faq)
13. [Melhores Práticas](#13-melhores-práticas)
14. [Glossário](#14-glossário)
15. [Suporte e Ajuda](#15-suporte-e-ajuda)
16. [Atualizações e Novidades](#16-atualizações-e-novidades)

---

## 1. Introdução
- **O que é**: CronoIn é uma plataforma para registrar jornadas e pontos, acompanhar equipes e garantir conformidade de horários, GPS e biometria facial.
- **Benefícios**: registro rápido, provas de localização/imagem, relatórios centralizados, notificações em tempo real e fluxo completo de RH.
- **Público alvo**: colaboradores (registro diário), gestores (aprovação e análise) e equipes de RH/Admin (configuração do sistema).
- **Requisitos mínimos**:
  - Navegadores: Chrome/Edge/Firefox atualizados ou Safari 14+.
  - Dispositivos: desktop/laptop; tablets/celulares com Android 10+ ou iOS 14+ (app mobile ou PWA).
  - Conexão: internet estável (mínimo 1 Mbps) e GPS habilitado para marcações com geolocalização.
  - Câmera frontal para reconhecimento facial.

## 2. Primeiros Passos

### 2.1 Como Acessar o Sistema
- **URL**: `https://app.cronoin.com` (produção) ou `https://staging.cronoin.com` (treinamento). Para testes locais use `http://localhost:19006`.
- **Navegadores compatíveis**: Chrome/Chromium, Edge, Firefox, Safari. Evite IE.
- **Requisitos**: permitir pop-ups do domínio e ativar cookies.
- **Aplicativo mobile**: disponível via Expo/Play Store/App Store (busque "CronoIn"), ou instale como PWA direto do navegador.

### 2.2 Criando sua Conta
1. Acesse a URL e clique em **“Criar conta”** na tela inicial. [SCREENSHOT: Tela de cadastro]
2. Informe nome completo, e-mail corporativo, CPF, telefone e departamento.
3. Escolha o perfil (Administrador, Gestor ou Colaborador). Perfis são aprovados pelo RH.
4. Envie uma foto nítida (selfie) para habilitar o reconhecimento facial.
5. Clique em **“Enviar”**. Você receberá um e-mail de confirmação em até 5 minutos.
6. Confirme o link enviado ao seu e-mail para ativar a conta.
7. Após a confirmação, complete o perfil com dados adicionais solicitados (data de admissão, cargo, supervisor).

> **Dica**: se não encontrar o e-mail de confirmação, verifique a caixa de spam ou contate o suporte.

### 2.3 Primeiro Login
1. Na tela inicial, informe seu e-mail e senha cadastrados. [SCREENSHOT: Tela de login]
2. Clique em **“Entrar”**.
3. Caso tenha esquecido a senha, selecione **“Esqueci minha senha”**, informe o e-mail e siga o link enviado.
4. Use senhas fortes (mínimo 8 caracteres, letras maiúsculas/minúsculas, número e símbolo).
5. Ative a **verificação em duas etapas** (se disponível nas Configurações de Conta).

### 2.4 Conhecendo a Interface
- **Cabeçalho**: mostra data/hora atual, botão de notificações e seu avatar.
- **Menu lateral**: atalhos para Dashboard, Registro de Ponto, Jornada, Usuários, Relatórios e Configurações. [SCREENSHOT: Menu principal]
- **Área central**: cards com indicadores (registros do dia, pendências, alertas GPS/facial).
- **Barra de ações rápidas**: botões para **“Marcar Ponto”**, **“Justificar ausência”** e **“Solicitar ajuste”**.
- **Notificações**: ícone de sino exibe alertas (aprovações pendentes, falhas de reconhecimento, etc.).
- **Configurações de conta**: clique no avatar > **“Minha conta”** para editar dados pessoais, senha, notificações e preferências.

---

## 3. Funcionalidades Principais
Cada funcionalidade inclui objetivo, passos, dicas e erros comuns.

### 3.1 Registro de Ponto
**O que faz:** registra entradas/saídas e comprovantes.

**Como usar:**
1. Clique em **“Marcar Ponto”** na home ou menu. [SCREENSHOT: Modal de marcação]
2. Escolha o tipo: **Entrada**, **Início de Intervalo**, **Fim de Intervalo** ou **Saída**.
3. Segure o celular/desktop na altura do rosto e toque em **“Capturar foto”** (obrigatório quando a empresa habilita biometria).
4. Mantenha GPS ativo. O app registra automaticamente a localização.
5. Confirme a marcação. Receba feedback imediato (verde = sucesso, amarelo = verificação manual).

**Dicas:**
- Mantenha iluminação frontal para melhorar o reconhecimento facial.
- Ative o modo "Usar relógio do servidor" caso o relógio do dispositivo esteja incorreto.

**Erros comuns:**
- *“Rosto não encontrado”*: reposicione a câmera e evite ambientes escuros.
- *“Você está fora da área permitida”*: aproxime-se do raio definido ou solicite ajuste ao gestor.

**Exemplo:** João chega às 08h00, abre o app, seleciona **Entrada**, tira uma selfie clara, aguarda o GPS validar e recebe confirmação.

### 3.2 Justificativa e Ajustes
**O que faz:** solicita correção de ponto ou justificativas (médico, viagem, etc.).

**Como usar:**
1. Vá em **Ponto > Justificativas**.
2. Clique em **“Nova justificativa”**.
3. Escolha o tipo (Atestado, Esquecimento, Viagem) e data.
4. Anexe documentos (PDF/JPG). [SCREENSHOT: Tela de justificativa]
5. Descreva o motivo e envie.

**Dicas:**
- Use linguagem objetiva e inclua contatos para confirmação, quando necessário.
- Acompanhe o status em **“Minhas solicitações”**.

**Erros comuns:** anexos acima de 10 MB ou em formato não suportado.

### 3.3 Gestão de Jornadas (Gestores/RH)
**O que faz:** cria e ajusta jornadas, tolerâncias, GPS e facial.

**Como usar:**
1. Menu **Admin > Jornadas**.
2. Clique em **“Nova Jornada”**.
3. Defina nome, horário inicial/final, pausa, tolerância e dias da semana.
4. Ligue **“Exigir GPS”** e ajuste o raio no mapa se necessário.
5. Salve e associe aos colaboradores.

**Dicas:**
- Utilize o calendário para marcar feriados ou folgas coletivas com antecedência.
- Revise configurações semanais para equipes com escalas diferenciadas.

**Erros comuns:** esquecer de associar a jornada ao usuário; use o atalho **“Vincular colaboradores”** após salvar.

### 3.4 Cadastro e Gestão de Usuários
**O que faz:** adiciona novos membros e gerencia permissões.

**Como usar:**
1. Menu **Admin > Usuários**.
2. Clique em **“Adicionar usuário”** ou importe via planilha (veja seção 8).
3. Preencha dados pessoais, departamento, cargo e permissões.
4. Anexe foto facial se for obrigatório.
5. Associe jornada padrão e gestor responsável.

**Dicas:**
- Utilize o campo **“Preferências”** para registrar observações (ex.: horários flexíveis).
- Desative usuários inativos para manter a base limpa.

**Erros comuns:** CPF/e-mail duplicados; revise antes de salvar.

### 3.5 Dashboard e Relatórios
**O que faz:** exibe métricas de presença, atrasos, pendências.

**Como usar:**
1. Abra **Dashboard**.
2. Ajuste filtros (período, departamento, equipe).
3. Clique em cards para ver detalhes (ex.: "Pontos pendentes").
4. Exporte em PDF/CSV via botão **“Exportar”**.

**Dicas:**
- Salve combinações de filtros favoritos (ícone de estrela).
- Compartilhe dashboards com o time via link interno.

**Erros comuns:** filtro sem resultados. Verifique se o período contém registros.

*(Repita o padrão acima para outras funcionalidades relevantes: Notificações, Painel do Gestor, Configurações Pessoais, etc.)*

---

## 4. Casos de Uso Comuns

### Caso 1: Registrar ponto e justificar atraso
- **Objetivo**: marcar entrada e justificar atraso eventual.
- **Passos**:
  1. Marque o ponto normalmente.
  2. Vá em **Justificativas > Nova**.
  3. Selecione o tipo "Trânsito" e descreva o ocorrido.
  4. Envie para aprovação.
- **Resultado**: registro fica pendente até o gestor aprovar; ao aprovar, status muda para "Justificado".

### Caso 2: Cadastrar novo colaborador sazonal
1. Menu **Usuários > Adicionar**.
2. Preencha dados mínimos e selecione perfil "Colaborador".
3. Escolha jornada de temporada e data de término.
4. Envie convite por e-mail com as credenciais.
- **Resultado**: colaborador acessa apenas durante o período definido.

### Caso 3: Aprovar ajustes em lote (Gestor)
1. Vá em **Ponto > Aprovações**.
2. Selecione o filtro "Equipe".
3. Marque múltiplas solicitações.
4. Clique em **“Aprovar selecionados”** ou **“Rejeitar”**.
5. Adicione comentário padrão.

---

## 5. Perfis e Permissões
- **Administrador**: configura o sistema, cria jornadas, gerencia todos os usuários, acessa relatórios globais e integrações.
- **Gestor**: acompanha equipe, aprova ajustes, vê dashboards da área, sugere jornadas.
- **Colaborador (Usuário Padrão)**: registra ponto, consulta histórico, envia justificativas, atualiza dados pessoais.
- **Visitante/Auditor (opcional)**: acesso somente leitura aos relatórios.

### Gerenciando Permissões
1. Vá em **Admin > Usuários**.
2. Selecione o usuário > **“Editar”**.
3. Ajuste o campo **Perfil/Permissão**.
4. Salve. Alterações são imediatas.
5. Para remover acesso, use **“Desativar usuário”**.

---

## 6. Configurações e Personalização

### Configurações de Conta
- **Dados pessoais**: avatar > **Minha conta > Dados**.
- **Foto de perfil**: clique no avatar e envie nova imagem (JPEG/PNG até 5 MB). [SCREENSHOT: Configurações pessoais]
- **Senha**: seção **Segurança** > **Alterar senha**.
- **Notificações**: ative/desative alertas por e-mail/push.
- **Preferências**: escolha idioma, fuso horário e tema (claro/escuro).

### Privacidade
- Controle quem pode ver seu status de presença (Equipe/Gestores/RH).
- Defina se deseja compartilhar localização aproximada nas notificações.

### Configurações do Sistema (Admins)
- **Parâmetros gerais**: horário comercial, tolerâncias padrão, políticas de faltas.
- **Integrações**: conecte sistemas de folha ou BI via chave API.
- **Customizações**: personalize logo e cores da empresa.

---

## 7. Recursos Avançados

### 7.1 Geofencing Avançado
- Configure múltiplas zonas (escritório, obra, cliente).
- Atribua zonas por jornada ou por colaborador.
- Visualize mapa com distâncias em tempo real.

### 7.2 Reconhecimento Facial Offline
- Em áreas com internet instável, use o modo offline no app mobile para capturar foto/assinatura e sincronizar depois.

---

## 8. Trabalhando com Dados

### Importando Usuários ou Jornadas
1. Baixe o modelo CSV em **Admin > Importar**.
2. Preencha os campos obrigatórios (nome, email, CPF, jornada).
3. Faça upload do arquivo.
4. Mapeie colunas com os campos do CronoIn.
5. Revise pré-visualização e confirme.
6. Corrija erros apontados (linha, motivo) e reenvie.

### Exportando Registros
- Vá a **Relatórios > Exportar**.
- Escolha formato (CSV, XLSX, PDF) e período/dia.
- Selecione filtros (departamento, status, GPS/facial).
- Clique em **“Gerar”** e acompanhe o progresso. O arquivo ficará disponível na área **Downloads** por 7 dias.

### Busca e Filtros
- Barra superior aceita nome, e-mail ou CPF.
- Use filtros avançados (ícone de funil) para combinar período, status e local.
- Salve pesquisas frequentes com o botão **“Salvar filtro”**.

---

## 9. Relatórios e Dashboards
- **Relatórios padrões**: Frequência, Atrasos, Banco de horas, Auditoria de rota.
- **Como gerar**: selecione relatório > filtros > **Gerar**.
- **Personalização**: ajuste colunas, gráficos e cores.
- **Dashboards**: arraste widgets para reorganizar; use filtros globais (topo direito) para todos os gráficos.
- **Exportar dashboards**: clique em **“Exportar PDF/Imagem”**.

---

## 10. Integrações
- **Folha de pagamento**: exporte CSV compatível ou use integração automática (API) com sistemas como Senior, ADP ou TOTVS.
- **Calendário corporativo**: sincronize feriados via arquivo ICS ou Google Calendar.
- **BI**: conecte ao Power BI/Tableau usando endpoint `/ponto/listar` e token API (solicite ao suporte).

---

## 11. Mobile
- **Download**: Play Store/App Store (busque "CronoIn") ou instale via Expo.
- **Diferenças**: versão mobile prioriza marcação de ponto, justificativas rápidas e notificações; dashboards completos estão na web.
- **Sincronização**: dados sincronizam automaticamente assim que o aparelho volta à internet.
- **Permissões**: autorize GPS, câmera e notificações push.

---

## 12. Solução de Problemas (FAQ)
1. **Esqueci minha senha** → Clique em *Esqueci minha senha* na tela de login e siga o e-mail.
2. **Conta bloqueada** → Após 5 tentativas falhas, aguarde 15 minutos ou fale com o RH.
3. **Sistema lento** → Verifique sua conexão; se persistir, reporte horário e ação executada.
4. **Upload falhou** → Confirme formato (PDF/JPG) e tamanho (<10 MB).
5. **GPS não ativa** → Dê permissão de localização precisa ao app.
6. **Erro de câmera** → Feche outros apps que usam a câmera e tente novamente.
7. **Ponto duplicado** → Solicite ajuste em Justificativas > Ajuste Manual.
8. **Horário incorreto** → Ative a opção "Sincronizar com servidor".
9. **Não recebo notificações** → Reative permissões do navegador/app.
10. **Relatório vazio** → Revise filtros de período e equipe.
11. **Não consigo aprovar** → Verifique se você tem perfil Gestor.
12. **Token expirado** → Faça login novamente.
13. **Erro 401** → Token ausente; limpe cache e relogue.
14. **Erro 500** → Anote hora, tela e ação; envie ao suporte.
15. **Não consigo associar jornada** → Confirme se a jornada foi criada antes e está ativa.
16. **Foto reprovada** → Use fundo neutro e evite uso de óculos escuros.
17. **Não consigo instalar app** → Atualize o SO ou libere espaço.
18. **Solicitação sem resposta** → Cheque se o gestor está definido; encaminhe ao RH.
19. **Erro de importação CSV** → Abra o arquivo no Excel e salve como UTF-8.
20. **Dúvidas gerais** → Consulte este manual ou a central de ajuda.

---

## 13. Melhores Práticas
- **Performance**: mantenha o app atualizado, limpe cache mensalmente e use rede estável ao marcar ponto.
- **Segurança**: não compartilhe senhas, ative 2FA e faça logout em dispositivos compartilhados.
- **Organização**: registre justificativas imediatamente, use etiquetas/tags nos relatórios e mantenha cadastros atualizados.

---

## 14. Glossário
- **Jornada**: conjunto de regras de horário e tolerâncias aplicadas a um colaborador.
- **Marcação**: registro individual de entrada, saída ou intervalo.
- **Justificativa**: solicitação formal para ajustar um registro.
- **GPS Radius**: raio de tolerância ao redor do local permitido.
- **Biometria facial**: assinatura digital baseada em imagem do rosto.

---

## 15. Suporte e Ajuda
- **Central de ajuda**: `https://help.cronoin.com`
- **Email**: suporte@cronoin.com
- **Chat ao vivo**: disponível das 8h às 20h (ícone no canto inferior direito da aplicação).
- **Telefone**: 0800-123-4567 (dias úteis, 9h-18h).
- **Reporte de bugs**: envie descrição, prints [SCREENSHOT], data/hora e navegador utilizado.
- **Sugestões**: formulário "Sugira uma melhoria" em Configurações > Feedback.

---

## 16. Atualizações e Novidades
- **Como acompanhar**: aba **Novidades** no dashboard e newsletter mensal.
- **Changelog**: disponível em `docs/CHANGELOG.md` (versão técnica) e resumo em `https://status.cronoin.com`.
- **Em desenvolvimento**:
  - Aprovação de ponto por WhatsApp
  - Relatórios dinâmicos com drill-down
  - Integração nativa com Outlook Calendar

> **Nota**: mantenha-se atento às notificações in-app para participar de betas e treinamentos.

---
**Ficou com dúvidas?** Consulte novamente este manual ou fale com a equipe de suporte. O CronoIn está em constante evolução para facilitar seu dia a dia.
