import azure.functions as func
from apis import BLUEPRINTS

# Azure Functions app with modular blueprint architecture
app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)

# Register all API blueprints
for blueprint in BLUEPRINTS:
    app.register_functions(blueprint) 