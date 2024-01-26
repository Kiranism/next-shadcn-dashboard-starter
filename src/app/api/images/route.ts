import { getAllFiles } from "../uploadthing/server";

export async function GET() {
    const files = await getAllFiles();
    const responseBody = JSON.stringify(files);
    return new Response(responseBody);
}