# Plugins and MCP

The `dsh-cli` profile is a Cordis composition. Commands registered by compatible DSH plugins automatically join the `/` menu; optional command-tree providers can add nested completion without taking ownership of execution.

Add an MCP client instance to `$DSH_HOME/profiles/dsh-cli/cordis.patch.yml`:

```yaml
- insert:
    - id: mcp-example
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: example
        transport: stdio
        command: npx
        args: ['-y', 'your-mcp-server-package']
        env:
          MCP_TOKEN: !!js process.env.MCP_TOKEN
```

Restart `dsh-cli` after changing the patch. Use unique `serverName` values. Keep credentials in environment variables; do not commit plaintext secrets. Discovered tools use the Harness registry and render with their specialized presenter when one is available, otherwise as a generic tool card.
