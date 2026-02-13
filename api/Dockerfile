FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 5000

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["WebhookApi.csproj", "."]
RUN dotnet restore "WebhookApi.csproj"
COPY . .
RUN dotnet build "WebhookApi.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "WebhookApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "WebhookApi.dll"]
