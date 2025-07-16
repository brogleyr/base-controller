import { jobEmbeddings } from '../data/jobEmbeddings';
import { courseEmbeddings } from '../data/courseEmbeddings';


export async function getJobEmbeddingData(): Promise<
  Array<{ url: string; emb: number[] }>
> {
  const results: { url: string; emb: number[] }[] = [];

  for (const entry of jobEmbeddings) {
    const url  = entry.url ?? '';
    const rawList = entry.emb;

    if (!Array.isArray(rawList)) continue;

    const emb: number[] = rawList.map((item: any) => {
      if (Array.isArray(item)) return Number(item[0]); 
      if (typeof item === 'object' && item !== null) {
        return Number(Object.values(item)[0]);      
      }
      return Number(item);                           
    });

    const isValid =
       emb.length > 0 &&
       emb.every(
        (v) =>
          typeof v === 'number' &&
          Number.isFinite(v) &&
          v >= -1 &&
          v <= 1
      );

    if (!isValid) continue;
    results.push({ url, emb });
  }

  return results;
}




export function getCourseEmbeddingData(
  courses: Array<{ courseCode: string; courseTitle: string }>,
): number[][] {
  const embeddings: number[][] = [];

  courses.forEach(({ courseCode, courseTitle }, idx) => {
    const match = courseEmbeddings.find(
      (c) => c.code === courseCode && c.title === courseTitle,
    );

    if (match) {
      embeddings.push(match.emb);
    } else {
      console.warn(
        `No embedding found for course #${idx} ` +
        `(${courseCode} – ${courseTitle}); skipping.`,
      );
    }
  });

  return embeddings;
}






