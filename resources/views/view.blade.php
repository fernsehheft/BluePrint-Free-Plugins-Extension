<div class="container" style="max-width: 420px; margin: 48px auto;">
    <div class="card" style="padding: 2rem; box-shadow: 0 1px 4px #0001; border-radius: 10px;">
        <h2 style="margin-bottom: 1rem;">Modrinth Browser: Admin Settings</h2>
        <!-- TODO: Make BackEnd -->
        <form>
            <div style="margin-bottom: 1.25rem;">
                <label for="apiToken" style="font-weight: 500;">Modrinth API Token</label>
                <input 
                    type="password" 
                    class="form-control" 
                    id="apiToken" 
                    name="apiToken" 
                    placeholder="Enter your Modrinth API token…" 
                    style="margin-top: 0.5rem;" 
                    disabled
                >
                <small class="form-text text-muted">
                    Required for plugin installation.<br>
                    The token will be securely stored.<br>
                    <span style="color:#c77c15;">(Coming soon: you&rsquo;ll be able to enter your API token here)</span>
                </small>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;" disabled>
                Save Token
            </button>
        </form>
    </div>
</div>