const cryto = require('crypto')

function createSession(username) {
    const ticket = crypto.randomBytes(32).toString('hex')
    const expiresAt = Date.now() + SESSION_TTL_MS;
    sessions.set(ticket, {username, expiresAt})
    return { ticket, expiresAt }
}

function getBearerToken(authHeader){
    return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
}

function requireAuth(req, res, next){
    const token = getBearerToken(req.headers.authorization);

    if (!token || !sessions.has(token)) return res.status(401).json({ error: 'Token does not exist' });

    if (sessions.get(token).expiresAt < Date.now()) {
        sessions.delete(token);   
        return res.status(401).json({ error: 'Token expired' });
    }

    req.user = { username: sessions.get(token).username, token}
    next();
}

app.post('/api/login', (req, res) => {
    const { username, password } = req.body || {};

    if (!AUTH_USERNAME || !AUTH_PASSWORD) return res.status(500).json( { error: 'Auth is not configured on server' } )

    if (!username ||!password) return res.status(400).json( { error: 'Username and password are required' } )
    
    if (username === AUTH_USERNAME && password === AUTH_PASSWORD){
        const session = createSession(username)
        return res.json(session)
    }

    res.status(401).json({error:'Invalid credentials'})
})