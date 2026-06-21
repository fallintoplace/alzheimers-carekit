import { expect, test } from '@playwright/test'

test('supports the core caregiver workflow', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Care command center/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Print shift packet' })).toBeVisible()
  await expect(page.locator('#main-content').getByText('4 of 4 ready')).toBeVisible()
  await page.getByRole('button', { name: 'Mark next done' }).click()
  await expect(page.getByText('1/4')).toBeVisible()
  await page.getByRole('button', { name: 'Cheerful' }).click()
  await page
    .getByLabel('Quick care note')
    .fill('Calm afternoon after the garden walk.')
  await page.getByRole('button', { name: 'Save note' }).click()
  await expect(
    page.locator('#main-content').getByText('Calm afternoon after the garden walk.'),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cheerful' })).toBeVisible()

  await page.getByRole('tab', { name: 'Routines', exact: true }).click()
  await page.getByLabel('Title').fill('Evening music')
  await page.getByLabel('Time').fill('18:30')
  await page.getByLabel('Category').fill('Comfort')
  await page
    .getByLabel('Notes')
    .fill('Play the jazz playlist quietly after dinner.')
  await page.getByRole('button', { name: 'Add routine' }).click()
  await page.getByLabel('Search routines').fill('music')
  await expect(page.locator('#main-content').getByText('Evening music')).toBeVisible()
  await page.getByRole('button', { name: 'Remove Evening music' }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.locator('#main-content').getByText('Evening music')).toBeVisible()

  await page.getByRole('tab', { name: 'Care log', exact: true }).click()
  await page.getByLabel('Search care log').fill('garden')
  await expect(
    page.locator('#main-content').getByText('Calm afternoon after the garden walk.'),
  ).toBeVisible()
  await page.getByLabel('Search care log').clear()
  await page.getByLabel('Notes').fill('Hydration was easier with a smaller cup.')
  await page.getByRole('button', { name: 'Add note' }).click()
  await expect(
    page.locator('#main-content').getByText('Hydration was easier with a smaller cup.'),
  ).toBeVisible()
  expect(errors).toEqual([])
})
