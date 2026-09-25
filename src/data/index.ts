import type { Procedure } from "../types";
import { arrival } from "./arrival";
import { citizenship } from "./citizenship";
import { patent } from "./patent";
import { vnzh } from "./vnzh";

export const procedures: Procedure[] = [arrival, patent, vnzh, citizenship];

export function getProcedure(id: string | undefined): Procedure | undefined {
  return procedures.find((item) => item.id === id);
}

export const SERVICE_DISCLAIMER =
  "Визит к юристу не нужен: вы сами заполняете клетки бланка МВД и получаете файл для печати и подачи. Это помощник, а не портал МВД. Перед подачей сверьте файл с бланком в подразделении. Подпись ставите от руки. Печати и герб здесь не ставятся. Список и заполнение бесплатны. Файл для скачивания, печати и письма открывается после оплаты услуги сервиса. Это не госпошлина.";
