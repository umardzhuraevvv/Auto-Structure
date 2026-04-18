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

  // Employees from commercial_structure.md + Financial block
  const employees: {
    id: number;
    fullName: string;
    position: string;
    department: string;
    duties: string;
    managerId: number | null;
  }[] = [
    // === Руководство ===
    {
      id: 1,
      fullName: 'Абрамец Егор',
      position: 'CEO',
      department: 'Руководство',
      duties: '– Общее руководство компанией',
      managerId: null,
    },
    {
      id: 2,
      fullName: 'Мамаджанов Дильшод',
      position: 'Коммерческий директор',
      department: 'Руководство',
      duties:
        '– Управление бизнесом — стратегия, цели, бюджет коммерческого блока\n– Координация всех направлений (KAM, КПБ, Trade-in, Support)\n– Держатель ЦФО — согласование расходов и инвестиций\n– Найм и развитие head\'ов направлений\n– Переговоры со стратегическими партнёрами на уровне CEO/собственников\n– Модерация и Support B2B/B2C — общий oversight\n– Финансовый блок — контроль P&L, маржинальности\n– KAM — финальное слово по крупнейшим дилерам\n– Отчётность перед CEO (Егор Абрамец)\n– Решения по ФОТ, грейдингу, мотивационным схемам',
      managerId: 1,
    },
    {
      id: 3,
      fullName: 'Джураев Умар',
      position: 'Зам. коммерческого директора / Head Trade-in',
      department: 'Trade-in / Фичи',
      duties:
        '– Разработка коммерческой стратегии совместно с директором\n– Постановка планов, KPI для команды\n– Анализ рынка, конкурентов, ценообразования\n– Управление воронкой продаж\n– Переговоры с ключевыми партнёрами\n– Отчётность для директора / топ-менеджмента\n– Участие в продуктовых задачах\n– Head направления Trade-in/Фичи\n– Курирование всех 4 направлений до формирования полной команды head\'ов',
      managerId: 2,
    },

    // === KAM — дилерская сеть ===
    {
      id: 4,
      fullName: 'Иванов Дильшод',
      position: 'Head KAM',
      department: 'KAM',
      duties:
        '– Стратегия развития партнёрской сети (дилеры, автосалоны)\n– Планирование и распределение портфеля между командой\n– Переговоры с крупными / стратегическими дилерами\n– Ценообразование на пакеты размещения\n– Передача обратной связи от дилеров в продукт\n– Отчётность перед коммерческим директором\n– Найм и развитие команды KAM',
      managerId: 2,
    },
    {
      id: 5,
      fullName: 'Мирзахмедов Батыр',
      position: 'Старший менеджер KAM',
      department: 'KAM',
      duties:
        '– Ведение портфеля дилеров\n– Переговоры со средними дилерами\n– Отчётность по партнёрской сети',
      managerId: 4,
    },
    {
      id: 6,
      fullName: 'Норимов Зафар',
      position: 'Менеджер KAM',
      department: 'KAM',
      duties:
        '– Привлечение новых дилеров\n– Ведение портфеля дилеров\n– Отчётность',
      managerId: 4,
    },

    // === Продукт КПБ / B2B Заявки ===
    {
      id: 7,
      fullName: 'Исламов Рустам',
      position: 'Head Продукт КПБ',
      department: 'Продукт КПБ',
      duties:
        '– Декомпозиция планов на команду\n– Менторинг и контроль специалистов\n– Коммуникация с КПБ по техническим проблемам\n– Самостоятельное ведение крупных/приоритетных партнёров\n– Онбординг новых дилеров\n– Контроль дебиторки\n– Отчётность по портфелю',
      managerId: 2,
    },
    {
      id: 8,
      fullName: 'Акбаралиев Рустам',
      position: 'Руководитель специалистов по заявкам B2B',
      department: 'Продукт КПБ',
      duties:
        '– Координация специалистов по заявкам\n– Заведение заявок\n– Помощь и поддержка партнёров\n– Коммуникация с КПБ\n– Ведение отчётности по заведённым заявкам',
      managerId: 7,
    },
    {
      id: 9,
      fullName: 'Эргашев Тимур',
      position: 'Старший специалист по заявкам B2B',
      department: 'Продукт КПБ',
      duties:
        '– Заведение кредитных заявок\n– Помощь и поддержка партнёров\n– Создание обучающих материалов при изменениях во флоу',
      managerId: 7,
    },
    {
      id: 10,
      fullName: 'Мухтаров Шохрух',
      position: 'Специалист по заявкам B2B',
      department: 'Продукт КПБ',
      duties:
        '– Заведение заявок\n– Помощь и поддержка партнёров',
      managerId: 7,
    },

    // === Trade-in / Фичи ===
    {
      id: 11,
      fullName: 'Камбаров Кувончбек',
      position: 'Старший менеджер точки быстрых продаж',
      department: 'Trade-in / Фичи',
      duties:
        '– Реализация возвратных автомобилей\n– Подключение партнёров/перекупов для быстрой реализации\n– Осмотр и оценка автомобиля\n– Сопровождение сделки на всех этапах (нотариус, ГАИ, подписание)\n– Формирование рыночной стоимости\n– Менеджмент жалоб клиентов на Uzum Auto',
      managerId: 3,
    },
    {
      id: 12,
      fullName: 'Кодиров Бунёд',
      position: 'Менеджер точки быстрых продаж',
      department: 'Trade-in / Фичи',
      duties:
        '– Реализация возвратных автомобилей\n– Осмотр и оценка автомобиля\n– Сопровождение сделки',
      managerId: 3,
    },

    // === Support ===
    {
      id: 13,
      fullName: 'ВАКАНСИЯ',
      position: 'Head of Support',
      department: 'Support',
      duties:
        '– Операционное управление командой Support\n– Запуск и контроль CS-функции (удержание мелких/средних дилеров по заказу KAM)\n– Media Support — мониторинг и отработка негативных отзывов\n– ОКК — контроль качества работы саппортов (чек-листы, прослушка)\n– Онбординг новых сотрудников\n– Скрипты и стандарты обслуживания\n– Отчётность перед зам. комм. директора',
      managerId: 2,
    },
    {
      id: 14,
      fullName: 'Саидмуродова Умида',
      position: 'Старший специалист (фактический CS-лид)',
      department: 'Support',
      duties:
        '– Конвертация лидов из входящих в платёж\n– Обработка тикетов\n– Координация команды Support в отсутствие Head',
      managerId: 13,
    },
    {
      id: 15,
      fullName: 'Шамурадова Лола',
      position: 'Специалист службы поддержки',
      department: 'Support',
      duties:
        '– Обработка тикетов\n– Приём входящих звонков\n– Обзвон заблокированных объявлений',
      managerId: 13,
    },
    {
      id: 16,
      fullName: 'Юлдашева Муштарий',
      position: 'Специалист службы поддержки',
      department: 'Support',
      duties:
        '– Обработка тикетов\n– Приём входящих звонков',
      managerId: 13,
    },

    // === Финансовый отдел (без изменений) ===
    {
      id: 17,
      fullName: 'Псакина Юлия',
      position: 'Финансовый директор',
      department: 'Финансовый Отдел',
      duties: '',
      managerId: 2,
    },
    {
      id: 18,
      fullName: 'Мирзарахметов Азизхон',
      position: 'Финансовый аналитик',
      department: 'Финансовый Отдел',
      duties: '',
      managerId: 17,
    },
    {
      id: 19,
      fullName: 'Ардеева Юлия',
      position: 'Главный бухгалтер',
      department: 'Финансовый Отдел',
      duties: '',
      managerId: 17,
    },
    {
      id: 20,
      fullName: 'Турсунматова Камилла',
      position: 'Помощник бухгалтера',
      department: 'Финансовый Отдел',
      duties: '',
      managerId: 17,
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
