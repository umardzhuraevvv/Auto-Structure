import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: new URL('../../.env', import.meta.url).pathname });

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hashed = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: 'admin@uzumauto.uz' },
    update: {},
    create: {
      email: 'admin@uzumauto.uz',
      password: hashed,
      name: 'Администратор',
      role: 'ADMIN',
    },
  });

  // Create a viewer account for HR
  const viewerPassword = await bcrypt.hash('viewer123', 10);
  await prisma.user.upsert({
    where: { email: 'hr@uzumauto.uz' },
    update: {},
    create: {
      email: 'hr@uzumauto.uz',
      password: viewerPassword,
      name: 'HR',
      role: 'VIEWER',
    },
  });

  console.log('Users created');

  // Clear existing employees
  await prisma.employee.deleteMany();

  // Employees data from Excel
  const employees: {
    id: number;
    fullName: string;
    position: string;
    department: string;
    duties: string;
    managerId: number | null;
  }[] = [
    {
      id: 1,
      fullName: 'Абрамец Егор',
      position: 'CEO',
      department: 'Руководство',
      duties: '–Общее руководство компанией',
      managerId: null,
    },
    {
      id: 2,
      fullName: 'Мамаджанов Дильшод',
      position: 'Коммерческий Директор',
      department: 'Коммерческий отдел',
      duties:
        '–Координация команды\n–Управление Бизнесом\n–Держатель ЦФО (согласование)\n–Контроль дебиторки и комиссионеров через Куратора Комерсов\n–Ответственный за всю коммерцию, Модерация и Support b2b/b2c, Финансовый Блок, КАМ',
      managerId: 1,
    },
    {
      id: 3,
      fullName: 'Джураев Умар',
      position: 'Зам. Коммерческий Директор',
      department: 'Коммерческий отдел',
      duties:
        '–Аналитика конкурентов\n–Составление Прогнозов\n–Разработка стратегий по достижению целей\n–Подключение партнеров\n–Оптимизация процессов ФА\n–Ведение переговоров с ЖПС поставщиком и внедрение в регионах (ФА)',
      managerId: 2,
    },
    {
      id: 4,
      fullName: 'Мирзахмедов Батыр',
      position: 'Старший Менеджер B2B',
      department: 'Коммерческий отдел',
      duties:
        '–Ведет онлайн обработку Лидген (ФА, Банковские продукты)\n–Ответственный за результаты КЦ\n–Отчетность ФА/Лидген\n–Составление графика работы команды ФА/Лидген\n–Подключение комиссионеров к продукту ФА\n–Оптимизация процессов в ФА',
      managerId: 2,
    },
    {
      id: 5,
      fullName: 'Исламов Рустам',
      position: 'Старший Менеджер B2B',
      department: 'Коммерческий отдел',
      duties:
        '–Курирует установку ЖПС на вторичке (Ташкент)\n–Конвертация лидов на рынке в сделку\n–Обзвон лидов\n–Осмотр авто с пробегом (вторичка)\n–Сопровождение сделки от А до Я\n–Обработка лидов на рынке',
      managerId: 2,
    },
    {
      id: 6,
      fullName: 'Кодиров Бунёд',
      position: 'Менеджер B2B',
      department: 'Коммерческий отдел',
      duties: '–Модерация\n–ОКК',
      managerId: 2,
    },
    {
      id: 7,
      fullName: 'Эргашев Тимур',
      position: 'Старший специалист Андеррайтинга',
      department: 'Коммерческий отдел',
      duties:
        '–Ведение отчетности ФА\n–Рассмотрение кредитных заявок\n–Онлайн собеседование потенциальных лидов ФА',
      managerId: 3,
    },
    {
      id: 8,
      fullName: 'Саидмуродова Умида',
      position: 'Старший специалист Андеррайтинга',
      department: 'Коммерческий отдел',
      duties: '–Рассмотрение кредитных заявок\n–Онлайн собеседование потенциальных лидов ФА',
      managerId: 3,
    },
    {
      id: 9,
      fullName: 'Сафиева Самира',
      position: 'Младший специалист Андеррайтинга',
      department: 'Коммерческий отдел',
      duties:
        '–Рассмотрение кредитных заявок\n–Онлайн собеседование потенциальных лидов ФА\n–Обработка чатов',
      managerId: 3,
    },
    {
      id: 10,
      fullName: 'Иванов Дильшод',
      position: 'Руководитель направления KAM',
      department: 'Коммерческий отдел',
      duties:
        '–Внедрение куаров УБ (временная задача)\n–Внедрение ФА в автосалоны\n–Ведение отчетности',
      managerId: 2,
    },
    {
      id: 11,
      fullName: 'Султонов Санжар',
      position: 'Менеджер KAM',
      department: 'Коммерческий отдел',
      duties: '–Внедрение ФА в автосалоны\n–Внедрение куаров УБ (временная задача)',
      managerId: 10,
    },
    {
      id: 12,
      fullName: 'Норимов Зафар',
      position: 'Менеджер KAM',
      department: 'Коммерческий отдел',
      duties: '–Внедрение ФА в автосалоны',
      managerId: 10,
    },
    {
      id: 13,
      fullName: 'Мирсадиков Алиер',
      position: 'Старший Менеджер KAM',
      department: 'Коммерческий отдел',
      duties:
        '–Подключение Автосалонов\n–Следит за процессом заведения заявок от комиссионеров\n–Заведение заявки и контроль документов в ЖСМ для выкупа авто в ФА\n–Помощь и поддержка партнеров\n–Прием и консультация клиентов по ФА\n–Дебиторка Узум Авто\n–Копирайтинг\n–Курирует установку жпс по первички (ташкент)',
      managerId: 10,
    },
    {
      id: 14,
      fullName: 'Турсунов Алмазхан',
      position: 'Старший Sales Специалист B2B',
      department: 'Коммерческий отдел',
      duties:
        '–Заведение заявок\n–Помощь и поддержка партнеров\n–Коммуникация с КПБ\n–Ведение отчетности по заведенным заявкам и обращениям Комерсов',
      managerId: 13,
    },
    {
      id: 15,
      fullName: 'Мухтаров Шохрух',
      position: 'Sales Специалист B2B',
      department: 'Коммерческий отдел',
      duties: '–Заведение заявок\n–Помощь и поддержка партнеров',
      managerId: 13,
    },
    {
      id: 16,
      fullName: 'Мирвалиева Мумтозбегим',
      position: 'Sales Специалист B2B',
      department: 'Коммерческий отдел',
      duties: '–Заведение заявок\n–Помощь и поддержка партнеров',
      managerId: 13,
    },
    {
      id: 17,
      fullName: 'Камбаров Кувончбек',
      position: 'Руководитель офиса продаж "Сергели"',
      department: 'Коммерческий отдел',
      duties:
        '–Конвертация лидов на рынке в сделку\n–Обзвон лидов\n–Ведение отчетов\n–Осмотр авто с пробегом (вторичка)\n–Сопровождение сделки от А до Я\n–Расширение партнерской сети',
      managerId: 4,
    },
    {
      id: 18,
      fullName: 'Юсупов Сардор',
      position: 'Младший менеджер отдела продаж',
      department: 'Коммерческий отдел',
      duties: '–Конвертация лидов на рынке в сделку\n–Обзвон лидов\n–Ведение отчетов',
      managerId: 17,
    },
    {
      id: 19,
      fullName: 'Акбаралиев Рустам',
      position: 'Старший менеджер отдела продаж',
      department: 'Коммерческий отдел',
      duties:
        '–Конвертация лидов на рынке в сделку\n–Обзвон лидов\n–Осмотр авто с пробегом (вторичка)\n–Сопровождение сделки от А до Я',
      managerId: 17,
    },
    {
      id: 20,
      fullName: 'Джаббаров Акбар',
      position: 'Руководитель Модерации и Саппорт B2B/B2C',
      department: 'Модерация и Суппорт',
      duties:
        '–Курирует процесс своих направлений\n–Оптимизация процессов (продуктовые решения в телефонии/битрикс)\n–Аналитика\n–Обновление подсказок для саппортов\n–Следит за обновлением инфомодели\n–Контроль качества модерации\n–Отчеты',
      managerId: 2,
    },
    {
      id: 21,
      fullName: 'Мусейлян Артур',
      position: 'Старший Специалист Модерации',
      department: 'Модерация и Суппорт',
      duties: '–Модерация\n–Заполнение инфомодели\n–По совместительству директор',
      managerId: 20,
    },
    {
      id: 22,
      fullName: 'Саъдуллаев Азизбек',
      position: 'Младший Специалист Модерации',
      department: 'Модерация и Суппорт',
      duties: '–Модерация',
      managerId: 20,
    },
    {
      id: 23,
      fullName: 'Масобиров Фарход',
      position: 'Младший Специалист Модерации',
      department: 'Модерация и Суппорт',
      duties: '–Модерация',
      managerId: 20,
    },
    {
      id: 24,
      fullName: 'Шамурадова Лола',
      position: 'Специалист службы поддержки',
      department: 'Модерация и Суппорт',
      duties:
        '–Обработка тикетов\n–Обзвон заблокированных объявлений\n–Прием входящих звонков',
      managerId: 20,
    },
    {
      id: 25,
      fullName: 'Шукурова Нозима',
      position: 'Специалист службы поддержки',
      department: 'Модерация и Суппорт',
      duties:
        '–Обработка тикетов\n–Обзвон заблокированных объявлений\n–Прием входящих звонков',
      managerId: 20,
    },
    {
      id: 26,
      fullName: 'Псакина Юлия',
      position: 'Финансовый Директор',
      department: 'Финансовый Отдел',
      duties: '',
      managerId: 2,
    },
    {
      id: 27,
      fullName: 'Мирзарахметов Азизхон',
      position: 'Финансовый Аналитик',
      department: 'Финансовый Отдел',
      duties: '',
      managerId: 26,
    },
    {
      id: 28,
      fullName: 'Ардеева Юлия',
      position: 'Гл. Бухгалтер',
      department: 'Финансовый Отдел',
      duties: '',
      managerId: 26,
    },
    {
      id: 29,
      fullName: 'Турсунматова Камилла',
      position: 'Помощница Бухгалтера',
      department: 'Финансовый Отдел',
      duties: '',
      managerId: 26,
    },
  ];

  for (const emp of employees) {
    await prisma.employee.create({
      data: {
        id: emp.id,
        fullName: emp.fullName,
        position: emp.position,
        department: emp.department,
        duties: emp.duties,
        managerId: emp.managerId,
      },
    });
  }

  // Reset PostgreSQL sequence after inserting with explicit IDs
  await prisma.$executeRawUnsafe(
    `SELECT setval('"Employee_id_seq"', (SELECT COALESCE(MAX(id), 0) FROM "Employee"))`
  );

  console.log(`Seeded ${employees.length} employees`);
  console.log('Done!');
  console.log('\nAdmin login: admin@uzumauto.uz / admin123');
  console.log('Viewer login: hr@uzumauto.uz / viewer123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
