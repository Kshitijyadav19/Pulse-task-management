def register_and_login(client, email="dev@example.com"):
    response = client.post("/api/v1/auth/register", json={"email": email, "full_name": "Test Developer", "password": "StrongPass123"})
    assert response.status_code == 201
    response = client.post("/api/v1/auth/login", json={"email": email, "password": "StrongPass123"})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}

def test_register_login_and_create_task(client):
    headers = register_and_login(client)
    response = client.post("/api/v1/tasks", headers=headers, json={"title": "Prepare for interview", "priority": "high"})
    assert response.status_code == 201
    assert response.json()["title"] == "Prepare for interview"

def test_tasks_require_authentication(client):
    response = client.get("/api/v1/tasks")
    assert response.status_code == 401

def test_user_cannot_access_another_users_task(client):
    first = register_and_login(client, "first@example.com")
    task = client.post("/api/v1/tasks", headers=first, json={"title": "Private task"}).json()
    second = register_and_login(client, "second@example.com")
    response = client.get(f"/api/v1/tasks/{task['id']}", headers=second)
    assert response.status_code == 404

def test_filter_and_pagination(client):
    headers = register_and_login(client)
    client.post("/api/v1/tasks", headers=headers, json={"title": "Urgent", "priority": "high"})
    client.post("/api/v1/tasks", headers=headers, json={"title": "Normal", "priority": "low"})
    response = client.get("/api/v1/tasks?priority=high&page=1&page_size=5", headers=headers)
    assert response.status_code == 200
    assert response.json()["total"] == 1
