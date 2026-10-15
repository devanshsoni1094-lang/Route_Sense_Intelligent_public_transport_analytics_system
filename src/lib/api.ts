const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!res.ok) {
      let errMsg = `API Request failed with status ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData?.message) errMsg = errorData.message;
        else if (errorData?.error) errMsg = errorData.error;
      } catch (_) {}
      const err = new Error(errMsg);
      (err as any).status = res.status;
      throw err;
    }

    return await res.json();
  } catch (error) {
    console.warn(`Fetch error for ${endpoint}:`, error);
    throw error;
  }
}
