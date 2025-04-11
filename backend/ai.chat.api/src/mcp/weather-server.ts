
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create server instance
const server = new McpServer({
  name: "bsu-weather",
  version: "1.0.0",
});

// Constants
const WEATHER_API_BASE = "https://api.weatherapi.com/v1";
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || ""; // You can leave this blank for free tier with limited requests

console.error("Starting BSU Weather MCP Server...");


// Helper function for making Weather API requests
async function makeWeatherRequest(endpoint: string, params: Record<string, string>): Promise<any> {
  const queryParams = new URLSearchParams({
    key: WEATHER_API_KEY,
    ...params
  });
  
  const url = `${WEATHER_API_BASE}/${endpoint}?${queryParams.toString()}`;

  console.log(url);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error making weather request:", error);
    throw error;
  }
}

// Register weather tools
server.tool(
  "get-current-weather",
  "Get current weather for a location",
  {
    location: z.string().describe("City name, US zip code, UK postcode, Canada postal code, IP address, or Latitude/Longitude"),
    units: z.enum(["metric", "imperial"]).optional().describe("Units for temperature (metric = Celsius, imperial = Fahrenheit)"),
  },
  async ({ location, units = "imperial" }) => {
    try {
      const data = await makeWeatherRequest("current.json", {
        q: location,
        aqi: "no"
      });
      
      const weatherInfo = {
        location: `${data.location.name}, ${data.location.country}`,
        temperature: `${units === "metric" ? data.current.temp_c : data.current.temp_f}°${units === "metric" ? "C" : "F"}`,
        feelsLike: `${units === "metric" ? data.current.feelslike_c : data.current.feelslike_f}°${units === "metric" ? "C" : "F"}`,
        description: data.current.condition.text,
        humidity: `${data.current.humidity}%`,
        windSpeed: `${units === "metric" ? data.current.wind_kph + " km/h" : data.current.wind_mph + " mph"}`,
        windDirection: data.current.wind_dir,
        pressure: `${units === "metric" ? data.current.pressure_mb + " mb" : data.current.pressure_in + " in"}`,
        precipitation: `${units === "metric" ? data.current.precip_mm + " mm" : data.current.precip_in + " in"}`,
        lastUpdated: data.current.last_updated,
      };
      
      const weatherText = `
Weather for ${weatherInfo.location}:
- Temperature: ${weatherInfo.temperature} (feels like ${weatherInfo.feelsLike})
- Conditions: ${weatherInfo.description}
- Humidity: ${weatherInfo.humidity}
- Wind: ${weatherInfo.windSpeed} ${weatherInfo.windDirection}
- Pressure: ${weatherInfo.pressure}
- Precipitation: ${weatherInfo.precipitation}
- Last Updated: ${weatherInfo.lastUpdated}
      `.trim();
      
      return {
        content: [
          {
            type: "text",
            text: weatherText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving weather data for "${location}": ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "get-weather-forecast",
  "Get 3-day weather forecast for a location",
  {
    location: z.string().describe("City name, US zip code, UK postcode, Canada postal code, IP address, or Latitude/Longitude"),
    units: z.enum(["metric", "imperial"]).optional().describe("Units for temperature (metric = Celsius, imperial = Fahrenheit)"),
    days: z.number().min(1).max(3).optional().describe("Number of days to forecast (1-3, defaults to 3)"),
  },
  async ({ location, units = "imperial", days = 3 }) => {
    try {
      const data = await makeWeatherRequest("forecast.json", {
        q: location,
        days: days.toString(),
        aqi: "no",
        alerts: "no"
      });
      
      let forecastText = `${days}-Day Forecast for ${data.location.name}, ${data.location.country}:\n\n`;
      
      data.forecast.forecastday.forEach((day: any) => {
        const date = new Date(day.date).toLocaleDateString();
        forecastText += `${date}:\n`;
        forecastText += `- Temperature: ${units === "metric" ? 
          `${day.day.avgtemp_c}°C (High: ${day.day.maxtemp_c}°C / Low: ${day.day.mintemp_c}°C)` : 
          `${day.day.avgtemp_f}°F (High: ${day.day.maxtemp_f}°F / Low: ${day.day.mintemp_f}°F)`}\n`;
        forecastText += `- Conditions: ${day.day.condition.text}\n`;
        forecastText += `- Humidity: ${day.day.avghumidity}%\n`;
        forecastText += `- Chance of Rain: ${day.day.daily_chance_of_rain}%\n`;
        forecastText += `- Wind: ${units === "metric" ? 
          `${day.day.maxwind_kph} km/h` : 
          `${day.day.maxwind_mph} mph`}\n\n`;
      });
      
      return {
        content: [
          {
            type: "text",
            text: forecastText.trim(),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving forecast data for "${location}": ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Register helpful prompts
server.prompt(
  "weather-impact-on-campus",
  "Analyze how weather conditions might impact campus activities",
  { 
    location: z.string().describe("Location to analyze (e.g., 'Boise')"),
    activity: z.string().describe("Type of campus activity (e.g., 'outdoor event', 'classes', 'sports game')"),
  },
  ({ location, activity }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `How will the current and forecasted weather conditions in ${location} impact the following campus activity: ${activity}? Please provide a detailed analysis including any safety considerations, alternative planning ideas, and recommendations for participants.`
        }
      }
    ]
  })
);

server.prompt(
  "weather-dress-code",
  "Get clothing recommendations based on weather",
  { 
    location: z.string().describe("Location for weather check (e.g., 'Boise')"),
    activity: z.string().optional().describe("Optional: specific activity (e.g., 'walking to class', 'football game')"),
  },
  ({ location, activity }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Based on the current weather in ${location}, what should I wear ${activity ? `for ${activity}` : "today"}? Please provide specific clothing recommendations for comfort and protection from the elements.`
        }
      }
    ]
  })
);

// Add a helpful prompt for campus events
server.prompt(
  "campus-weather-alert",
  "Get a weather alert message for campus communications",
  { 
    location: z.string().describe("Campus location (e.g., 'Boise State University')"),
    eventType: z.string().describe("Type of alert (e.g., 'snow closure', 'thunderstorm warning', 'heat advisory')"),
  },
  ({ location, eventType }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Create a formal weather alert message for ${location} regarding a ${eventType}. Include essential safety information, affected campus operations, alternate arrangements, and contact information for emergency services. Format it appropriately for a campus-wide communication.`
        }
      }
    ]
  })
);

// Start the server
async function main() {
  console.error("Initializing transport...");
  const transport = new StdioServerTransport();
  console.error("Transport initialized, connecting...");
  
  try {
    await server.connect(transport);
    console.error("BSU Weather MCP Server running on stdio transport");
  } catch (error) {
    console.error("Error connecting server:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});