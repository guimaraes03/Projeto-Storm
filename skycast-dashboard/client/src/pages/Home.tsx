import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Search, MapPin, Wind, Droplets, Eye, Gauge } from "lucide-react";

interface WeatherData {
  city: string;
  country: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  pressure: number;
  feelsLike: number;
  icon: string;
}

interface ForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  description: string;
  icon: string;
}

export default function Home() {
  const [city, setCity] = useState("São Paulo");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Função para buscar dados de clima
  const fetchWeather = async (cityName: string) => {
    setLoading(true);
    setError("");
    try {
      // Usando Open-Meteo API (gratuita, sem chave necessária)
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1&language=pt&format=json`
      );
      const geoData = await geoResponse.json();

      if (!geoData.results || geoData.results.length === 0) {
        setError("Cidade não encontrada");
        setLoading(false);
        return;
      }

      const { latitude, longitude, name, country } = geoData.results[0];

      // Buscar dados de clima
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility,pressure_msl&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
      );
      const weatherData = await weatherResponse.json();

      const current = weatherData.current;
      const daily = weatherData.daily;

      // Mapear código de clima para descrição
      const weatherDescriptions: Record<number, string> = {
        0: "Céu Limpo",
        1: "Parcialmente Nublado",
        2: "Nublado",
        3: "Muito Nublado",
        45: "Nevoeiro",
        48: "Nevoeiro com Geada",
        51: "Chuva Leve",
        53: "Chuva Moderada",
        55: "Chuva Forte",
        61: "Chuva",
        63: "Chuva Moderada",
        65: "Chuva Forte",
        71: "Neve Leve",
        73: "Neve Moderada",
        75: "Neve Forte",
        77: "Grãos de Neve",
        80: "Chuva Leve",
        81: "Chuva Moderada",
        82: "Chuva Forte",
        85: "Neve Leve",
        86: "Neve Forte",
        95: "Tempestade",
        96: "Tempestade com Granizo",
        99: "Tempestade com Granizo Forte",
      };

      // Mapear código para ícone
      const getWeatherIcon = (code: number) => {
        if (code === 0) return "☀️";
        if (code === 1 || code === 2) return "⛅";
        if (code === 3) return "☁️";
        if (code === 45 || code === 48) return "🌫️";
        if (code >= 51 && code <= 67) return "🌧️";
        if (code >= 71 && code <= 86) return "❄️";
        if (code >= 95 && code <= 99) return "⛈️";
        return "🌤️";
      };

      setWeather({
        city: name,
        country: country || "",
        temperature: Math.round(current.temperature_2m),
        description: weatherDescriptions[current.weather_code] || "Desconhecido",
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        visibility: Math.round(current.visibility / 1000),
        pressure: current.pressure_msl,
        feelsLike: Math.round(current.apparent_temperature),
        icon: getWeatherIcon(current.weather_code),
      });

      // Processar previsão dos próximos 5 dias
      const forecastData: ForecastDay[] = daily.time.slice(0, 5).map((date: string, index: number) => ({
        date: new Date(date).toLocaleDateString("pt-BR", { weekday: "short", month: "short", day: "numeric" }),
        tempMax: Math.round(daily.temperature_2m_max[index]),
        tempMin: Math.round(daily.temperature_2m_min[index]),
        description: weatherDescriptions[daily.weather_code[index]] || "Desconhecido",
        icon: getWeatherIcon(daily.weather_code[index]),
      }));

      setForecast(forecastData);
      setCity(name);
    } catch (err) {
      setError("Erro ao buscar dados de clima. Tente novamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar clima ao montar o componente
  useEffect(() => {
    fetchWeather(city);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchWeather(searchInput);
      setSearchInput("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: "Poppins" }}>
                SkyCast
              </h1>
              <p className="text-gray-600 text-sm">Dashboard de Previsão do Tempo</p>
            </div>
          </div>

          {/* Barra de Busca */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Buscar cidade..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 rounded-lg"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
            </Button>
          </form>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading && !weather ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : weather ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Clima Atual - Seção Principal */}
            <div className="lg:col-span-2">
              <Card className="p-8 bg-white shadow-lg rounded-2xl border-0">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-blue-500" />
                      <h2 className="text-2xl font-semibold text-gray-900">{weather.city}</h2>
                    </div>
                    <p className="text-gray-600">{weather.description}</p>
                  </div>
                  <div className="text-7xl">{weather.icon}</div>
                </div>

                <div className="mb-8">
                  <div className="text-6xl font-bold text-gray-900" style={{ fontFamily: "Poppins" }}>
                    {weather.temperature}°C
                  </div>
                  <p className="text-gray-600 mt-2">Sensação térmica: {weather.feelsLike}°C</p>
                </div>

                {/* Grid de Detalhes */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Droplets className="w-5 h-5 text-blue-500" />
                      <span className="text-sm text-gray-600">Umidade</span>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900">{weather.humidity}%</p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Wind className="w-5 h-5 text-blue-500" />
                      <span className="text-sm text-gray-600">Vento</span>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900">{weather.windSpeed} km/h</p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-5 h-5 text-blue-500" />
                      <span className="text-sm text-gray-600">Visibilidade</span>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900">{weather.visibility} km</p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Gauge className="w-5 h-5 text-blue-500" />
                      <span className="text-sm text-gray-600">Pressão</span>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900">{Math.round(weather.pressure)} hPa</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Previsão dos Próximos Dias - Sidebar */}
            <div>
              <Card className="p-6 bg-white shadow-lg rounded-2xl border-0 h-full">
                <h3 className="text-xl font-semibold text-gray-900 mb-4" style={{ fontFamily: "Poppins" }}>
                  Próximos Dias
                </h3>
                <div className="space-y-3">
                  {forecast.map((day, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <p className="text-sm font-medium text-gray-700 mb-2">{day.date}</p>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{day.icon}</span>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">{day.tempMax}°</p>
                          <p className="text-sm text-gray-600">{day.tempMin}°</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">{day.description}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600 text-sm">
          <p>SkyCast Dashboard © 2026 | Dados fornecidos por Open-Meteo</p>
        </div>
      </footer>
    </div>
  );
}
