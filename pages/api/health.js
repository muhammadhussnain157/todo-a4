// Health check endpoint for Kubernetes probes
// This endpoint doesn't require authentication

export default function handler(req, res) {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
}
