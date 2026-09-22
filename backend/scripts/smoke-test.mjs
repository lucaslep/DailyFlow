const apiUrl = process.env.API_URL ?? "http://127.0.0.1:3333";
const suffix = Date.now();

async function request(path, options = {}, cookie = "") {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...options.headers,
    },
  });
  const body = response.status === 204 ? undefined : await response.json();
  return { response, body, cookie: response.headers.get("set-cookie")?.split(";")[0] ?? cookie };
}

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

const health = await request("/health");
ensure(health.response.ok, "Endpoint de saúde indisponível");

const registration = await request("/auth/register", {
  method: "POST",
  body: JSON.stringify({ name: "Smoke Test", email: `smoke.${suffix}@example.com`, password: "SmokeSeguro123!" }),
});
ensure(registration.response.status === 201, "Cadastro falhou");
ensure(registration.cookie.includes("taskpulse_session="), "Cookie de sessão ausente");

const createdTask = await request("/tasks", {
  method: "POST",
  body: JSON.stringify({ title: "Smoke task", status: "TODO", priority: "HIGH" }),
}, registration.cookie);
ensure(createdTask.response.status === 201, "Criação de tarefa falhou");

const tasks = await request("/tasks", {}, registration.cookie);
ensure(tasks.response.ok && tasks.body.length === 1, "Listagem autenticada falhou");

const anonymous = await request("/tasks");
ensure(anonymous.response.status === 401, "Rota protegida aceitou acesso anônimo");

console.log("Smoke test concluído com sucesso.");
