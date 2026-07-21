export type CuisineItem = {
  id: string;
  name: string;
};

export const fetchCuisines = async (): Promise<CuisineItem[]> => {
  const res = await fetch(
    "https://www.themealdb.com/api/json/v1/1/list.php?a=list",
  );

  const json = await res.json();

  return (json.meals ?? []).map((m: any) => ({
    id: m.strArea,
    name: m.strArea,
  }));
};
