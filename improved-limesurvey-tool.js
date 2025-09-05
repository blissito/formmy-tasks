const LIMESURVEY_URL = 'https://limesurvey-app.fly.dev/index.php/admin/remotecontrol';

// Configuración por defecto (puede ser parametrizada)
const DEFAULT_CONFIG = {
    username: process.env.LIMESURVEY_USERNAME || 'admin',
    password: process.env.LIMESURVEY_PASSWORD || 'fallback_password'
};

const func = async (input) => {
    // Parsear el input string que viene de Flowise
    let method, params = {}, config = DEFAULT_CONFIG;
    
    if (typeof input === 'string') {
        // Formato: "list_surveys" o "get_survey_properties 123" o "method param1 param2"
        const parts = input.trim().split(' ');
        method = parts[0];
        
        // Convertir parámetros posicionales a objeto según el método
        if (parts.length > 1) {
            switch (method) {
                case 'get_survey_properties':
                case 'list_participants':
                case 'get_participant_properties':
                    params.surveyId = parts[1];
                    break;
                case 'add_participants':
                    params.surveyId = parts[1];
                    params.participantData = parts.slice(2);
                    break;
                default:
                    // Para otros métodos, usar parámetros como array
                    params.args = parts.slice(1);
            }
        }
    } else if (typeof input === 'object') {
        // Si viene como objeto (para compatibilidad futura)
        method = input.method;
        params = input.params || {};
        config = input.config || DEFAULT_CONFIG;
    } else {
        return 'Error: Formato de entrada inválido. Use string o objeto.';
    }
    let sessionKey = null;
    
    try {
        console.log(`Ejecutando método LimeSurvey: ${method}`);
        
        // 1. Obtener session key (login)
        const loginResponse = await fetch(LIMESURVEY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                method: 'get_session_key',
                params: [config.username, config.password],
                id: 1
            })
        });

        if (!loginResponse.ok) {
            return `Error de conectividad: ${loginResponse.status} - ${loginResponse.statusText}`;
        }

        const loginData = await loginResponse.json();
        
        if (loginData.error) {
            return `Error de autenticación: ${loginData.error.message}`;
        }
        
        sessionKey = loginData.result;
        
        if (!sessionKey || sessionKey.status === 'Invalid user name or password') {
            return 'Error: Credenciales inválidas. Verifica username y password.';
        }

        // 2. Ejecutar el método solicitado
        let methodParams = [sessionKey];
        
        if (params.surveyId) {
            methodParams.push(params.surveyId);
        }
        if (params.participantData) {
            methodParams.push(...params.participantData);
        }
        if (params.args && Array.isArray(params.args)) {
            methodParams.push(...params.args);
        }
        if (Object.keys(params).length > 0 && !params.surveyId && !params.args && !params.participantData) {
            methodParams.push(...Object.values(params));
        }
        
        const methodResponse = await fetch(LIMESURVEY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                method: method,
                params: methodParams,
                id: 2
            })
        });

        if (!methodResponse.ok) {
            return `Error ejecutando ${method}: ${methodResponse.status} - ${methodResponse.statusText}`;
        }

        const methodData = await methodResponse.json();
        
        if (methodData.error) {
            return `Error en método ${method}: ${methodData.error.message}`;
        }

        // 3. Cerrar sesión
        await fetch(LIMESURVEY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                method: 'release_session_key',
                params: [sessionKey],
                id: 3
            })
        });

        console.log('Método ejecutado exitosamente:', methodData.result);
        return JSON.stringify(methodData.result, null, 2);
        
    } catch (error) {
        console.error('Error ejecutando LimeSurvey API:', error);
        
        // Intentar cerrar sesión si existe
        if (sessionKey) {
            try {
                await fetch(LIMESURVEY_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        method: 'release_session_key',
                        params: [sessionKey],
                        id: 99
                    })
                });
            } catch (cleanupError) {
                console.error('Error cerrando sesión:', cleanupError);
            }
        }
        
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return `Error de conexión: No se puede conectar a ${LIMESURVEY_URL}. Verifica que el servidor esté funcionando.`;
        } else if (error.name === 'AbortError') {
            return 'Error: La petición tardó demasiado en responder (timeout).';
        } else {
            return `Error desconocido: ${error.message}`;
        }
    }
};

return func;