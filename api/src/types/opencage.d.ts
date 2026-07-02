declare module 'opencage-api-client' {
  interface GeocodeOptions {
    q: string;
    language?: string;
    [key: string]: any;
  }

  interface GeometryResult {
    lat: number;
    lng: number;
  }

  interface ComponentsResult {
    [key: string]: string;
  }

  interface AnnotationsResult {
    timezone?: {
      name: string;
      offset_sec?: number;
    };
    [key: string]: any;
  }

  interface Result {
    formatted: string;
    geometry: GeometryResult;
    components: ComponentsResult;
    annotations?: AnnotationsResult;
  }

  interface StatusResult {
    code: number;
    message: string;
  }

  interface GeocodeResponse {
    results: Result[];
    status: StatusResult;
    total_results: number;
  }

  export function geocode(options: GeocodeOptions): Promise<GeocodeResponse>;
  export default { geocode };
}
