export default async function handler(req, res) {
    if (req.method === "POST") {
        return res.status(200).json({ message: "Create widget API ready" });
    }

    if (req.method === "GET") {
        return res.status(200).json({ message: "Fetch widget API ready" });
    }

    return res.status(405).json({ error: "Method not allowed" });
}
