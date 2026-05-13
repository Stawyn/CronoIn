"""
Rota para o painel de testes da API (tipo Postman)
Carrega automaticamente todas as rotas do OpenAPI
"""
from fastapi.responses import HTMLResponse

def get_tester_html():
    """Retorna o HTML do painel de testes tipo Postman"""
    return """<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Tester - CronoIn</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1e1e1e; color: #d4d4d4; height: 100vh; overflow: hidden;
        }
        .container { display: flex; flex-direction: column; height: 100vh; }
        .header {
            background: #2d2d30; padding: 15px 20px; border-bottom: 1px solid #3e3e42;
            display: flex; justify-content: space-between; align-items: center;
        }
        .header h1 { color: #fff; font-size: 18px; font-weight: 600; }
        .header-info { color: #858585; font-size: 12px; }
        .main-content { display: flex; flex: 1; overflow: hidden; }
        .sidebar {
            width: 320px; background: #252526; border-right: 1px solid #3e3e42;
            overflow-y: auto; padding: 10px; display: flex; flex-direction: column;
        }
        .search-box {
            width: 100%; padding: 8px; background: #1e1e1e; border: 1px solid #555;
            border-radius: 4px; color: #fff; margin-bottom: 10px; font-size: 13px;
        }
        .request-panel { flex: 1; display: flex; flex-direction: column; background: #1e1e1e; overflow: hidden; }
        .request-bar {
            background: #2d2d30; padding: 15px; border-bottom: 1px solid #3e3e42;
            display: flex; gap: 10px; align-items: center;
        }
        .method-select {
            padding: 8px 12px; background: #3e3e42; border: 1px solid #555; border-radius: 4px;
            color: #fff; font-weight: 600; cursor: pointer; min-width: 100px;
        }
        .method-get { background: #4caf50; border-color: #4caf50; }
        .method-post { background: #2196f3; border-color: #2196f3; }
        .method-put { background: #ff9800; border-color: #ff9800; }
        .method-delete { background: #f44336; border-color: #f44336; }
        .method-patch { background: #9c27b0; border-color: #9c27b0; }
        .url-input {
            flex: 1; padding: 8px 12px; background: #1e1e1e; border: 1px solid #555;
            border-radius: 4px; color: #fff; font-family: 'Courier New', monospace; font-size: 14px;
        }
        .url-input:focus { outline: none; border-color: #007acc; }
        .send-btn {
            padding: 8px 20px; background: #007acc; border: none; border-radius: 4px;
            color: #fff; font-weight: 600; cursor: pointer; transition: background 0.2s;
        }
        .send-btn:hover { background: #005a9e; }
        .send-btn:disabled { background: #555; cursor: not-allowed; }
        .request-body { flex: 1; display: flex; flex-direction: column; padding: 15px; overflow-y: auto; }
        .tabs { display: flex; gap: 5px; margin-bottom: 15px; border-bottom: 1px solid #3e3e42; }
        .tab {
            padding: 8px 16px; background: transparent; border: none; color: #858585;
            cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s;
        }
        .tab.active { color: #007acc; border-bottom-color: #007acc; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .form-section { margin-bottom: 20px; }
        .form-section h3 { color: #fff; font-size: 14px; margin-bottom: 10px; font-weight: 600; }
        .param-row {
            display: grid; grid-template-columns: 1fr 2fr auto; gap: 10px;
            margin-bottom: 10px; align-items: center;
        }
        .param-row input, .param-row select {
            padding: 6px 10px; background: #2d2d30; border: 1px solid #555;
            border-radius: 4px; color: #fff; font-size: 13px;
        }
        .param-row input:focus, .param-row select:focus { outline: none; border-color: #007acc; }
        .remove-btn {
            padding: 6px 12px; background: #f44336; border: none; border-radius: 4px;
            color: #fff; cursor: pointer; font-size: 12px;
        }
        .add-btn {
            padding: 6px 12px; background: #4caf50; border: none; border-radius: 4px;
            color: #fff; cursor: pointer; font-size: 12px; margin-top: 10px;
        }
        .json-editor {
            width: 100%; min-height: 200px; padding: 10px; background: #1e1e1e;
            border: 1px solid #555; border-radius: 4px; color: #d4d4d4;
            font-family: 'Courier New', monospace; font-size: 14px; resize: vertical;
        }
        .json-editor:focus { outline: none; border-color: #007acc; }
        .response-panel { flex: 1; display: flex; flex-direction: column; border-top: 1px solid #3e3e42; background: #1e1e1e; }
        .response-header {
            background: #2d2d30; padding: 10px 15px; display: flex;
            justify-content: space-between; align-items: center; border-bottom: 1px solid #3e3e42;
        }
        .response-status {
            padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;
        }
        .status-2xx { background: #4caf50; color: #fff; }
        .status-4xx { background: #ff9800; color: #fff; }
        .status-5xx { background: #f44336; color: #fff; }
        .response-body {
            flex: 1; padding: 15px; overflow-y: auto; font-family: 'Courier New', monospace;
            font-size: 13px; white-space: pre-wrap; word-wrap: break-word;
        }
        .route-item {
            padding: 10px; margin-bottom: 5px; background: #2d2d30; border-radius: 4px;
            cursor: pointer; transition: background 0.2s;
        }
        .route-item:hover { background: #3e3e42; }
        .route-item.active { background: #007acc; }
        .route-method {
            display: inline-block; padding: 2px 6px; border-radius: 3px;
            font-size: 11px; font-weight: 600; margin-right: 8px;
        }
        .route-path { color: #d4d4d4; font-size: 13px; }
        .route-tag { display: block; color: #858585; font-size: 11px; margin-top: 4px; }
        .loading { text-align: center; padding: 40px; color: #858585; }
        .spinner {
            border: 3px solid #3e3e42; border-top: 3px solid #007acc; border-radius: 50%;
            width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 20px auto;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .routes-container { flex: 1; overflow-y: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 API Tester - CronoIn</h1>
            <div class="header-info">
                <span id="api-url-display">Carregando...</span> | 
                <span id="route-count">0 rotas</span>
            </div>
        </div>
        <div class="main-content">
            <div class="sidebar">
                <input type="text" class="search-box" id="search-routes" placeholder="🔍 Buscar rotas...">
                <div class="routes-container" id="routes-list">
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>Carregando rotas...</p>
                    </div>
                </div>
            </div>
            <div class="request-panel">
                <div class="request-bar">
                    <select id="method-select" class="method-select method-get">
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                        <option value="PATCH">PATCH</option>
                    </select>
                    <input type="text" id="url-input" class="url-input" placeholder="Selecione uma rota ou digite a URL...">
                    <button id="send-btn" class="send-btn" onclick="sendRequest()">Send</button>
                </div>
                <div class="request-body">
                    <div class="tabs">
                        <button class="tab active" onclick="showTab('params')">Params</button>
                        <button class="tab" onclick="showTab('headers')">Headers</button>
                        <button class="tab" onclick="showTab('body')">Body</button>
                    </div>
                    <div id="params-tab" class="tab-content active">
                        <div class="form-section">
                            <h3>Query Parameters</h3>
                            <div id="query-params"></div>
                            <button class="add-btn" onclick="addQueryParam()">+ Add Param</button>
                        </div>
                        <div class="form-section">
                            <h3>Path Parameters</h3>
                            <div id="path-params"></div>
                        </div>
                    </div>
                    <div id="headers-tab" class="tab-content">
                        <div class="form-section">
                            <h3>Headers</h3>
                            <div id="headers-list"></div>
                            <button class="add-btn" onclick="addHeader()">+ Add Header</button>
                        </div>
                    </div>
                    <div id="body-tab" class="tab-content">
                        <div class="form-section">
                            <h3>Body (JSON)</h3>
                            <textarea id="body-editor" class="json-editor" placeholder='{"key": "value"}'></textarea>
                        </div>
                    </div>
                </div>
                <div class="response-panel">
                    <div class="response-header">
                        <span>Response</span>
                        <span id="response-status" class="response-status" style="display: none;"></span>
                        <span id="response-time" style="color: #858585; font-size: 12px;"></span>
                    </div>
                    <div id="response-body" class="response-body">Aguardando requisição...</div>
                </div>
            </div>
        </div>
    </div>
    <script>
        let openAPISchema = null;
        let selectedRoute = null;
        const API_BASE_URL = window.location.origin;

        window.onload = function() {
            loadOpenAPISchema();
            document.getElementById('search-routes').addEventListener('input', filterRoutes);
            document.getElementById('method-select').addEventListener('change', updateMethodSelectStyle);
            addHeader('Content-Type', 'application/json');
            updateMethodSelectStyle();
        };

        function updateMethodSelectStyle() {
            const select = document.getElementById('method-select');
            const method = select.value.toLowerCase();
            select.className = `method-select method-${method}`;
        }

        async function loadOpenAPISchema() {
            try {
                const response = await fetch(`${API_BASE_URL}/openapi.json`);
                if (!response.ok) throw new Error('Erro ao carregar schema');
                openAPISchema = await response.json();
                document.getElementById('api-url-display').textContent = API_BASE_URL;
                renderRoutes();
            } catch (error) {
                document.getElementById('routes-list').innerHTML = `
                    <div class="loading">
                        <p style="color: #f44336;">Erro: ${error.message}</p>
                        <p style="font-size: 12px; margin-top: 10px;">Certifique-se de que o servidor está rodando.</p>
                    </div>
                `;
            }
        }

        function parseRoutes(schema) {
            const routes = [];
            const paths = schema.paths || {};
            for (const [path, methods] of Object.entries(paths)) {
                for (const [method, details] of Object.entries(methods)) {
                    if (typeof details === 'object') {
                        routes.push({
                            path, method: method.toUpperCase(), details,
                            tag: details.tags?.[0] || 'Outros',
                            summary: details.summary || path
                        });
                    }
                }
            }
            return routes.sort((a, b) => {
                if (a.tag !== b.tag) return a.tag.localeCompare(b.tag);
                return a.path.localeCompare(b.path);
            });
        }

        function renderRoutes() {
            if (!openAPISchema) return;
            const routes = parseRoutes(openAPISchema);
            const routesList = document.getElementById('routes-list');
            const searchTerm = document.getElementById('search-routes').value.toLowerCase();
            let html = '';
            let currentTag = '';
            routes.forEach(route => {
                if (searchTerm && !route.path.toLowerCase().includes(searchTerm) && 
                    !route.summary.toLowerCase().includes(searchTerm) &&
                    !route.tag.toLowerCase().includes(searchTerm)) return;
                if (route.tag !== currentTag) {
                    if (currentTag) html += '</div>';
                    html += `<div style="margin-top: 15px; margin-bottom: 10px;">
                        <h3 style="color: #858585; font-size: 12px; text-transform: uppercase; font-weight: 600;">${route.tag}</h3>
                    `;
                    currentTag = route.tag;
                }
                const pathEscaped = route.path.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                html += `
                    <div class="route-item" onclick="selectRoute('${route.method}', '${pathEscaped}')">
                        <span class="route-method method-${route.method.toLowerCase()}">${route.method}</span>
                        <span class="route-path">${route.path}</span>
                        <span class="route-tag">${route.summary}</span>
                    </div>
                `;
            });
            if (currentTag) html += '</div>';
            routesList.innerHTML = html || '<div class="loading"><p>Nenhuma rota encontrada</p></div>';
            document.getElementById('route-count').textContent = `${routes.length} rotas`;
        }

        function filterRoutes() { renderRoutes(); }

        function selectRoute(method, path) {
            selectedRoute = { method, path };
            document.querySelectorAll('.route-item').forEach(item => item.classList.remove('active'));
            event.target.closest('.route-item').classList.add('active');
            document.getElementById('method-select').value = method;
            updateMethodSelectStyle();
            document.getElementById('url-input').value = path;
            const routeDetails = openAPISchema.paths[path][method.toLowerCase()];
            if (routeDetails) loadRouteDetails(routeDetails, path);
        }

        function loadRouteDetails(details, path) {
            const pathParams = details.parameters?.filter(p => p.in === 'path') || [];
            renderPathParams(pathParams);
            const queryParams = details.parameters?.filter(p => p.in === 'query') || [];
            renderQueryParams(queryParams);
            if (details.requestBody) {
                const bodySchema = details.requestBody.content?.['application/json']?.schema;
                if (bodySchema) renderBodyEditor(bodySchema);
            } else {
                document.getElementById('body-editor').value = '';
            }
        }

        function renderPathParams(params) {
            const container = document.getElementById('path-params');
            container.innerHTML = '';
            params.forEach(param => {
                const row = document.createElement('div');
                row.className = 'param-row';
                const paramName = (param.name || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                const description = ((param.description || param.name) || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                row.innerHTML = `
                    <input type="text" value="${paramName}" readonly style="background: #3e3e42; color: #858585;">
                    <input type="text" id="path-${paramName}" placeholder="${description}">
                    <span style="color: #858585; font-size: 12px;">${param.required ? 'Required' : 'Optional'}</span>
                `;
                container.appendChild(row);
            });
        }

        function renderQueryParams(params) {
            const container = document.getElementById('query-params');
            container.innerHTML = '';
            params.forEach(param => {
                addQueryParamRow(param.name || '', (param.description || '').replace(/"/g, '&quot;'), param.required || false);
            });
        }

        function addQueryParam(name = '', value = '', required = false) {
            addQueryParamRow(name, '', required, value);
        }

        function addQueryParamRow(name, description, required, value = '') {
            const container = document.getElementById('query-params');
            const row = document.createElement('div');
            row.className = 'param-row';
            const nameEscaped = (name || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            const valueEscaped = (value || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            row.innerHTML = `
                <input type="text" class="param-key" value="${nameEscaped}" placeholder="Key">
                <input type="text" class="param-value" value="${valueEscaped}" placeholder="Value">
                <button class="remove-btn" onclick="this.parentElement.remove()">Remove</button>
            `;
            container.appendChild(row);
        }

        function addHeader(name = '', value = '') {
            const container = document.getElementById('headers-list');
            const row = document.createElement('div');
            row.className = 'param-row';
            const nameEscaped = (name || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            const valueEscaped = (value || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            row.innerHTML = `
                <input type="text" class="header-key" value="${nameEscaped}" placeholder="Header name">
                <input type="text" class="header-value" value="${valueEscaped}" placeholder="Header value">
                <button class="remove-btn" onclick="this.parentElement.remove()">Remove</button>
            `;
            container.appendChild(row);
        }

        function renderBodyEditor(schema) {
            const editor = document.getElementById('body-editor');
            if (!schema) {
                editor.value = '';
                return;
            }
            let finalSchema = schema;
            if (schema.$ref) {
                const schemaName = schema.$ref.replace('#/components/schemas/', '');
                finalSchema = openAPISchema.components?.schemas?.[schemaName];
            }
            if (finalSchema && finalSchema.properties) {
                const example = generateExampleFromSchema(finalSchema);
                editor.value = JSON.stringify(example, null, 2);
            } else {
                editor.value = '';
            }
        }

        function generateExampleFromSchema(schema) {
            const example = {};
            const properties = schema.properties || {};
            for (const [key, prop] of Object.entries(properties)) {
                let propSchema = prop;
                if (prop.$ref) {
                    const schemaName = prop.$ref.replace('#/components/schemas/', '');
                    propSchema = openAPISchema.components?.schemas?.[schemaName] || prop;
                }
                const type = propSchema.type || 'string';
                const format = propSchema.format;
                if (type === 'string') {
                    if (format === 'email') example[key] = 'email@example.com';
                    else if (format === 'date') example[key] = new Date().toISOString().split('T')[0];
                    else if (format === 'time') example[key] = '08:00:00';
                    else example[key] = '';
                } else if (type === 'integer') {
                    example[key] = 0;
                } else if (type === 'number') {
                    example[key] = 0.0;
                } else if (type === 'boolean') {
                    example[key] = false;
                } else if (type === 'array') {
                    example[key] = [];
                } else if (type === 'object') {
                    example[key] = {};
                } else {
                    example[key] = null;
                }
            }
            return example;
        }

        function showTab(tabName) {
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            event.target.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        }

        async function sendRequest() {
            const method = document.getElementById('method-select').value;
            let url = document.getElementById('url-input').value;
            const sendBtn = document.getElementById('send-btn');
            const responseBody = document.getElementById('response-body');
            const responseStatus = document.getElementById('response-status');
            const responseTime = document.getElementById('response-time');
            
            if (!url || !url.trim()) {
                alert('Por favor, informe a URL');
                return;
            }
            
            sendBtn.disabled = true;
            responseBody.textContent = 'Enviando requisição...';
            responseBody.style.color = '#d4d4d4';
            responseStatus.style.display = 'none';
            responseTime.textContent = '';
            const startTime = performance.now();
            
            try {
                // Substituir path parameters
                const pathParamRows = document.querySelectorAll('#path-params .param-row');
                pathParamRows.forEach(row => {
                    const inputs = row.querySelectorAll('input');
                    if (inputs.length >= 2) {
                        const key = inputs[0].value;
                        const value = inputs[1].value;
                        if (key && value) {
                            url = url.replace(`{${key}}`, encodeURIComponent(value));
                        } else if (key && !value && row.querySelector('span').textContent.includes('Required')) {
                            throw new Error(`Parâmetro de rota obrigatório '${key}' não informado`);
                        }
                    }
                });
                
                // Coletar query parameters
                const queryParams = {};
                document.querySelectorAll('#query-params .param-row').forEach(row => {
                    const keyInput = row.querySelector('.param-key');
                    const valueInput = row.querySelector('.param-value');
                    if (keyInput && valueInput) {
                        const key = keyInput.value.trim();
                        const value = valueInput.value.trim();
                        if (key && value) queryParams[key] = value;
                    }
                });
                
                const queryString = new URLSearchParams(queryParams).toString();
                if (queryString) url += (url.includes('?') ? '&' : '?') + queryString;
                
                // Coletar headers
                const headers = {};
                document.querySelectorAll('#headers-list .param-row').forEach(row => {
                    const keyInput = row.querySelector('.header-key');
                    const valueInput = row.querySelector('.header-value');
                    if (keyInput && valueInput) {
                        const key = keyInput.value.trim();
                        const value = valueInput.value.trim();
                        if (key && value) headers[key] = value;
                    }
                });
                
                // Adicionar Content-Type padrão se necessário
                if (!headers['Content-Type'] && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                    headers['Content-Type'] = 'application/json';
                }
                
                // Coletar body
                let body = null;
                if (method !== 'GET' && method !== 'DELETE') {
                    const bodyText = document.getElementById('body-editor').value.trim();
                    if (bodyText) {
                        try {
                            body = JSON.parse(bodyText);
                        } catch (e) {
                            throw new Error(`Erro ao fazer parse do JSON: ${e.message}`);
                        }
                    }
                }
                
                // Fazer requisição
                const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
                const options = { method: method, headers: headers };
                if (body) options.body = JSON.stringify(body);
                
                const response = await fetch(fullUrl, options);
                const endTime = performance.now();
                const duration = ((endTime - startTime) / 1000).toFixed(2);
                
                let responseData;
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    try {
                        const text = await response.text();
                        responseData = text ? JSON.parse(text) : null;
                    } catch {
                        responseData = await response.text();
                    }
                } else {
                    responseData = await response.text();
                }
                
                // Mostrar status
                responseStatus.style.display = 'inline-block';
                responseStatus.textContent = `${response.status} ${response.statusText}`;
                responseStatus.className = `response-status ${
                    response.status >= 200 && response.status < 300 ? 'status-2xx' :
                    response.status >= 400 && response.status < 500 ? 'status-4xx' :
                    'status-5xx'
                }`;
                
                responseTime.textContent = `${duration}s`;
                
                // Mostrar resposta
                if (responseData === null || responseData === undefined) {
                    responseBody.textContent = '(sem conteúdo)';
                } else if (typeof responseData === 'object') {
                    responseBody.textContent = JSON.stringify(responseData, null, 2);
                } else {
                    responseBody.textContent = responseData.toString();
                }
                responseBody.style.color = response.ok ? '#4caf50' : '#f44336';
            } catch (error) {
                const endTime = performance.now();
                const duration = ((endTime - startTime) / 1000).toFixed(2);
                responseStatus.style.display = 'inline-block';
                responseStatus.textContent = 'Error';
                responseStatus.className = 'response-status status-5xx';
                responseTime.textContent = `${duration}s`;
                responseBody.textContent = `Erro: ${error.message}`;
                responseBody.style.color = '#f44336';
            } finally {
                sendBtn.disabled = false;
            }
        }
    </script>
</body>
</html>"""

