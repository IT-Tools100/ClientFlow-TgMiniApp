# DESIGN_SYSTEM.md

# Дизайн-система ClientFlow

## Главный стиль

Стиль проекта: **Liquid Glass**.

Это не просто прозрачные карточки. Это премиальный mobile UI с ощущением стекла, глубины, мягкого света и чистого интерфейса.

## Визуальное направление

Интерфейс должен ощущаться как:

- современный iOS-style продукт
- premium dashboard
- Telegram Mini App
- легкая CRM для телефона
- приложение, которым реально удобно пользоваться

## Основные принципы

1. Mobile-first.
2. Крупные зоны нажатия.
3. Много воздуха.
4. Хорошая читаемость.
5. Не перегружать стеклянными эффектами.
6. Все карточки должны быть полезными, а не декоративными.
7. Нижняя навигация должна быть удобной для большого пальца.

## Цветовая палитра

### Dark mode base

- Background: #070A12
- Surface: rgba(255, 255, 255, 0.08)
- Surface strong: rgba(255, 255, 255, 0.12)
- Border: rgba(255, 255, 255, 0.16)
- Text primary: #F8FAFC
- Text secondary: #AEB7C8
- Muted: #6B7280

### Accent colors

- Primary blue: #60A5FA
- Cyan glow: #22D3EE
- Purple: #A78BFA
- Green: #34D399
- Orange: #FBBF24
- Red: #FB7185

## Фоны

Использовать:

- темный градиент
- мягкие glow blobs
- radial gradients
- blur layers

Пример направления:

- dark navy background
- blue/purple glow top right
- cyan glow bottom left
- subtle noise/texture optional

## Glass cards

Карточки должны иметь:

- translucent background
- backdrop blur
- thin border
- soft shadow
- rounded corners
- subtle inner highlight

Пример CSS-направления:

```css
background: rgba(255, 255, 255, 0.08);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.14);
box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
```

## Типографика

- Использовать системный шрифт или Inter.
- Заголовки короткие и сильные.
- Не использовать мелкий текст меньше 12px для важных данных.
- Цифры в dashboard должны быть крупными.

## Компоненты

Нужны reusable components:

- GlassCard
- Button
- Badge
- Input
- Select
- SearchInput
- BottomNav
- SectionHeader
- StatCard
- ClientCard
- DealCard
- TaskCard
- Modal / Drawer
- EmptyState

## Навигация

Bottom navigation:

- Dashboard
- Clients
- Tasks
- Deals
- Profile

Analytics можно открыть из Dashboard или отдельной вкладкой, если помещается.

## Карточки статусов

Статусы должны быть цветными бейджами:

- New: blue
- Contacted: cyan
- In Progress: purple
- Waiting Payment: orange
- Paid: green
- Lost: red/gray

## Важное ограничение

Не делать интерфейс слишком похожим на обычную админку. Это именно Telegram Mini App, поэтому интерфейс должен быть компактным, вертикальным, быстрым и удобным на телефоне.
