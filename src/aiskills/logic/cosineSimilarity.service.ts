// Cosine similarity between two vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}


// Pairwise cosine similarity between two arrays of vectors
export function cosineSimilarityMatrix(
  A: number[][],
  B: number[][]
): number[][] {
  return A.map((vecA) => B.map((vecB) => cosineSimilarity(vecA, vecB)));
}

// Compute the column-wise mean of an array
// Insure that the array is homoogeneous
export function meanByColumn(matrix: number[][]): number[] {
  if (matrix.length === 0) return [];

  const k = matrix[0].length;
  const sums = new Array<number>(k).fill(0);
  let validRowCount = 0;

  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r];

    for (let c = 0; c < k; c++) {
      sums[c] += row[c];
    }

    validRowCount++;
  }

  if (validRowCount === 0) return [];

  return sums.map((total) => total / validRowCount);
}

