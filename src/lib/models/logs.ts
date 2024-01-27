

export default class Log {
    public _id: string;
    public phone: string;
    public message: string;
    public imageId: string;
    public key: string;
    public timestamp: Date;
    public status: string;

    constructor(_id: string, phone: string, message: string, imageId: string, key:string, timestamp: Date, status: string) {
        this._id = _id;
        this.phone = phone;
        this.message = message;
        this.imageId = imageId;
        this.key = key;
        this.timestamp = timestamp;
        this.status = status;
    }
}