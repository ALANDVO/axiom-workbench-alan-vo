"""Verify the built Compose frontend against its actual backend and persistent DB."""
import json, subprocess, time, urllib.request, uuid
from playwright.sync_api import sync_playwright, expect

def ready(url):
    deadline = time.monotonic() + 120
    while time.monotonic() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=3) as response:
                if response.status == 200: return
        except OSError: pass
        time.sleep(1)
    raise RuntimeError('Service failed readiness: ' + url)

ready('http://127.0.0.1:8000/health')
ready('http://127.0.0.1/')
name = 'browser-' + uuid.uuid4().hex[:12]
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto('http://127.0.0.1/')
    page.get_by_role('button', name='+ Add Model', exact=True).click()
    page.get_by_label('Name *', exact=True).fill(name)
    page.get_by_label('Display Name *', exact=True).fill('Browser Registry Model')
    with page.expect_response(lambda r: r.request.method == 'POST' and r.url.endswith('/api/v1/models')) as created:
        page.get_by_role('button', name='Register Model', exact=True).click()
    response = created.value
    assert response.status == 201, response.text()
    identifier = response.json()['id']
    expect(page.get_by_role('row').filter(has_text=name)).to_have_count(1)
    page.get_by_role('button', name='Edit ' + name, exact=True).click()
    page.get_by_label('Display Name *', exact=True).fill('Updated Browser Model')
    with page.expect_response(lambda r: r.request.method == 'PATCH' and r.url.endswith('/api/v1/models/' + identifier)) as updated:
        page.get_by_role('button', name='Update Model', exact=True).click()
    assert updated.value.status == 200, updated.value.text()
    expect(page.get_by_role('row').filter(has_text=name)).to_contain_text('Updated Browser Model')
    page.reload()
    expect(page.get_by_role('row').filter(has_text=name)).to_contain_text('Updated Browser Model')
    subprocess.run(['docker', 'compose', 'restart', 'backend'], check=True)
    ready('http://127.0.0.1:8000/health')
    page.reload()
    expect(page.get_by_role('row').filter(has_text=name)).to_contain_text('Updated Browser Model')
    with urllib.request.urlopen('http://127.0.0.1:8000/api/v1/models/' + identifier) as response:
        persisted = json.load(response)
    assert persisted['name'] == name and persisted['display_name'] == 'Updated Browser Model'
    print(json.dumps({'browser_create':True,'browser_edit':True,'reload':True,'backend_restart_persistence':True,'record_id':identifier}))
    browser.close()
