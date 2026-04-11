export const toJSON = (rows: any[]) => {
  const [header, ...data] = rows;

  return data.map((row) =>
    header.reduce((acc: any, key: string, i: number) => {
      acc[key] = row[i];
      return acc;
    }, {})
  );
};