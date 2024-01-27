import { formatDate as format } from "date-fns";
import { id } from "date-fns/locale";

export function formatDateLocal(date: Date): string {

    // GMT +7
    date.setHours(date.getHours() + 7);

    return format(date, "dd/MM/yyyy HH:mm:ss", { locale: id });
}
