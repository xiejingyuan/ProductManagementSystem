using System.Text.Json;
using System.Text.Json.Serialization;

public class AiService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    public AiService(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _apiKey = config["Anthropic:ApiKey"] ?? string.Empty;
    }

    public async Task<string> GenerateDescriptionAsync(string productName, string category)
    {
        var requestBody = new
        {
            model = "claude-sonnet-4-6",
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

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages");
        request.Headers.Add("x-api-key", _apiKey);
        request.Headers.Add("anthropic-version", "2023-06-01");
        request.Content = JsonContent.Create(requestBody);

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<AnthropicResponse>(
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        return result?.Content.FirstOrDefault()?.Text ?? string.Empty;
    }
}

public class AnthropicResponse
{
    public List<AnthropicContent> Content { get; set; } = new();
}

public class AnthropicContent
{
    public string Type { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
}
