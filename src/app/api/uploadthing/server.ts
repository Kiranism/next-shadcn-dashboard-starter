import "server-only"

import { UTApi } from "uploadthing/server";

export const utapi = new UTApi({
    apiKey: process.env.UPLOADTHING_SECRET,
});


export const getAllFiles = async () => {
    return await utapi.listFiles({ limit: 100000, offset: 0 });
}
