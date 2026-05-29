using System.Text.Json;
using System.Text.Json.Serialization;

public class AiService
{
    private static readonly JsonSerializerOptions _jsonOptions =
        new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    public AiService(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _apiKey = config["Groq:ApiKey"] ?? string.Empty;
    }

    public async Task<string> GenerateDescriptionAsync(string productName, string category)
    {
        var requestBody = new
        {
            model = "llama-3.3-70b-versatile",
            max_tokens = 256,
            messages = new[]
            {
                new
                {
                    role = "user",
                    content = $"Write a concise product description for a {category} product named '{productName}'. Keep it under 100 words, professional, and highlight key benefits."
                }
            }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
        request.Headers.Add("Authorization", $"Bearer {_apiKey}");
        request.Content = JsonContent.Create(requestBody);

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<GroqResponse>(_jsonOptions);

        return result?.Choices.FirstOrDefault()?.Message.Content ?? string.Empty;
    }
}

public class GroqResponse
{
    public List<GroqChoice> Choices { get; set; } = new();
}

public class GroqChoice
{
    public GroqMessage Message { get; set; } = new();
}

public class GroqMessage
{
    public string Content { get; set; } = string.Empty;
}
