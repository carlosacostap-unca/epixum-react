import { expect, test, type Page } from '@playwright/test';
import PocketBase from 'pocketbase';

const pocketBaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL ?? 'http://127.0.0.1:8094';
const passwords = {
  student: ['student@test.local', 'EpixumStudent1234!'],
  teacher: ['teacher@test.local', 'EpixumTeacher1234!'],
  administrator: ['admin@test.local', 'EpixumAdmin1234!'],
} as const;

async function loginAs(page: Page, role: keyof typeof passwords) {
  const [email, password] = passwords[role];
  const pb = new PocketBase(pocketBaseUrl);
  pb.autoCancellation(false);
  await pb.collection('users').authWithPassword(email, password);
  const cookieHeader = pb.authStore.exportToCookie({ httpOnly: false, secure: false, sameSite: 'Lax', path: '/' });
  const pair = cookieHeader.split(';', 1)[0];
  const separator = pair.indexOf('=');
  await page.context().addCookies([{
    name: pair.slice(0, separator),
    value: pair.slice(separator + 1),
    url: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3100',
  }]);
}

async function selectCohort(page: Page, name: string) {
  const selector = page.getByLabel('Cohorte activa');
  await expect(selector).toBeVisible();
  await selector.selectOption({ label: name });
  await expect(selector).toHaveValue(await selector.locator(`option:has-text("${name}")`).getAttribute('value') ?? '');
}

test('student switches cohorts and completes delivery, review and inquiry journeys', async ({ page }) => {
  await loginAs(page, 'student');
  await page.goto('/sprints');
  await selectCohort(page, 'Cohorte inicial');
  await expect(page.getByText('Sprint E2E Cohorte A')).toBeVisible();
  await expect(page.getByText('Sprint E2E Cohorte B')).toHaveCount(0);

  await selectCohort(page, 'Cohorte E2E B');
  await expect(page).toHaveURL(/\/cohorts\/[^/]+\/sprints/);
  await expect(page.getByText('Sprint E2E Cohorte B')).toBeVisible();
  await expect(page.getByText('Sprint E2E Cohorte A')).toHaveCount(0);

  await page.getByText('Sprint E2E Cohorte B').click();
  await page.getByText('TP E2E Cohorte B').click();
  await expect(page.getByText('Mi Entrega')).toBeVisible();
  await expect(page.getByRole('link', { name: /github\.com\/epixum\/e2e-b/ })).toBeVisible();
  await page.getByRole('button', { name: 'Modificar Entrega' }).click();
  const repository = page.getByPlaceholder('github.com/usuario/repositorio').first();
  await repository.fill('github.com/epixum/e2e-b-updated');
  await page.getByRole('button', { name: 'Modificar Entrega' }).last().click();
  await expect(page.getByRole('link', { name: /e2e-b-updated/ })).toBeVisible();

  await page.getByRole('link', { name: 'Revisiones' }).click();
  await page.getByText('Sprint E2E Cohorte B').click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Reservar Turno' }).click();
  await expect(page.getByText('(Tu reserva)')).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Cancelar Reserva' }).click();
  await expect(page.getByRole('button', { name: 'Reservar Turno' })).toBeVisible();

  await page.getByRole('link', { name: 'Consultas' }).click();
  await expect(page.getByText('Consulta E2E Cohorte B')).toBeVisible();
  await expect(page.getByText('Consulta E2E Cohorte A')).toHaveCount(0);
  await page.getByPlaceholder(/Buscar por/).fill('Respuesta E2E exclusiva B');
  await expect(page).toHaveURL(/search=Respuesta/);
  await expect(page.getByText('Consulta E2E Cohorte B')).toBeVisible();
});

test('teacher manages academic work while cohort data stays isolated', async ({ page }) => {
  await loginAs(page, 'teacher');
  await page.goto('/cohorts');
  await selectCohort(page, 'Cohorte E2E B');
  await page.getByRole('link', { name: 'Sprints' }).click();
  await expect(page.getByText('Sprint E2E Cohorte B')).toBeVisible();
  await expect(page.getByText('Sprint E2E Cohorte A')).toHaveCount(0);

  await page.getByText('Sprint E2E Cohorte B').click();
  await page.getByRole('button', { name: 'Nueva Clase' }).click();
  await page.locator('input[name="title"]').fill('Clase creada por docente E2E');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Clase creada por docente E2E')).toBeVisible();
  await page.getByText('TP E2E Cohorte B').click();
  await expect(page.getByText('Entregas (1)')).toBeVisible();
  await expect(page.getByRole('link', { name: /Repositorio/ })).toBeVisible();

  await page.getByRole('link', { name: 'Revisiones' }).click();
  await page.getByText('Sprint E2E Cohorte B').click();
  await expect(page.getByText('Gestionar Turnos')).toBeVisible();
  await page.getByRole('link', { name: 'Estudiantes' }).click();
  await expect(page.getByRole('row', { name: /Test Student student@test\.local Estudiante Activa/ })).toBeVisible();
  await page.getByRole('link', { name: 'Consultas' }).click();
  await expect(page.getByText('Consulta E2E Cohorte B')).toBeVisible();
  await expect(page.getByText('Consulta E2E Cohorte A')).toHaveCount(0);
});

test('administrator manages global course and cohort lifecycle across cohorts', async ({ page }) => {
  await loginAs(page, 'administrator');
  await page.goto('/admin/courses');
  await page.getByLabel('Nombre').first().fill('Curso E2E Administrador');
  await page.locator('form').filter({ hasText: 'Nuevo curso' }).locator('textarea[name="description"]').fill('Curso creado por la prueba integral');
  await page.getByRole('button', { name: 'Crear curso' }).click();
  await expect(page.locator('input[value="Curso E2E Administrador"]')).toBeVisible();

  await page.getByRole('link', { name: 'Cohortes' }).click();
  await expect(page.getByRole('heading', { name: 'Cohorte inicial' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cohorte E2E B' })).toBeVisible();
  await page.getByLabel('Curso').selectOption({ label: 'React' });
  await page.getByLabel('Nombre').fill('Cohorte planificada E2E');
  await page.getByLabel('Fecha inicial').fill('2027-03-01');
  await page.getByLabel('Fecha final').fill('2027-06-30');
  await page.getByRole('button', { name: 'Crear cohorte' }).click();
  await expect(page.getByRole('heading', { name: 'Cohorte planificada E2E' })).toBeVisible();

  await selectCohort(page, 'Cohorte E2E B');
  await page.getByRole('link', { name: 'Estudiantes' }).click();
  await expect(page.getByRole('row', { name: /Test Student student@test\.local Estudiante Activa/ })).toBeVisible();
  await page.getByRole('link', { name: 'Administrar Usuarios' }).click();
  await expect(page.getByText('Test Student', { exact: true }).first()).toBeVisible();
});
