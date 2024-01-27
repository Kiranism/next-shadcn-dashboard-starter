import Log from "../models/logs";
import { getCollection } from "../mongodb";
import { ObjectId } from "mongodb";

export async function getAllLogs() {

    const collection = await getCollection("logs", "whatsapp-api")

    return (collection.find({}).toArray()) as unknown as Promise<Log[]>;
}

export async function getLogById(id: string) {
    const collection = await getCollection("logs", "whatsapp-api");
    const objectId = new ObjectId(id);
    return (collection.findOne({ _id: objectId })) as unknown as Promise<Log>;
}
    