import { getSession } from 'next-auth/react';
import connectDb from '../../lib/connectDb';
import Todo from '../../models/Todo';

export default async function Handler(req, res) {
    if (req.method === 'POST') {
        const session = await getSession({ req });

        if (!session) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        try {
            await connectDb();
            const todo = await Todo.create({
                content: req.body.content,
                important: false,
                task_done: false,
                userId: session.user.id,
            });
            res.status(201).json({ message: 'OK', todo: todo });
        } catch (err) {
            console.log('Error: ', err.message);
            res.status(500).json({ message: 'FAILED', error: err.message });
        }
    } else {
        res.status(400).json({ message: 'FAILED' });
    }
}
