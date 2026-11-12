/** Russian for every interface string, keyed by the English source text. */
export const RU: Record<string, string> = {
  // Island: shared
  Paused: 'Пауза',
  Pause: 'Пауза',
  Resume: 'Продолжить',
  Cancel: 'Отмена',
  Stop: 'Стоп',
  Skip: 'Пропустить',
  Dismiss: 'Скрыть',
  Play: 'Играть',
  Previous: 'Назад',
  Next: 'Дальше',
  Copied: 'Скопировано',
  Done: 'Готово',
  Saved: 'Сохранено',
  'Could not connect': 'Нет соединения',
  'Focus mode is on': 'Режим фокуса включён',
  of: 'из',
  ms: 'мс',
  On: 'Вкл',
  Off: 'Выкл',
  Now: 'Сейчас',
  You: 'Вы',

  // Timer, focus
  Timer: 'Таймер',
  'Timer finished': 'Таймер завершён',
  Focus: 'Фокус',
  Break: 'Перерыв',
  'Focus session complete': 'Сессия фокуса завершена',

  // Recording
  'Recording screen': 'Запись экрана',
  'Recording saved': 'Запись сохранена',

  // Music
  'Playing on': 'Играет в',

  // Discord
  'is calling': 'звонит',
  'Discord call': 'Звонок в Discord',
  Decline: 'Отклонить',
  Accept: 'Принять',
  Mute: 'Выключить микрофон',
  Unmute: 'Включить микрофон',
  Deafen: 'Выключить звук',
  Undeafen: 'Включить звук',
  Leave: 'Выйти',
  'Call declined': 'Звонок отклонён',
  'Left the voice channel': 'Вы вышли из канала',

  // Dictation and assistant
  Listening: 'Слушаю',
  Transcribing: 'Распознаю',
  Inserted: 'Вставлено',
  'No microphone': 'Нет микрофона',
  'Start speaking…': 'Говорите…',
  Thinking: 'Думаю',
  Writing: 'Пишу ответ',
  'Answer ready': 'Ответ готов',
  'Copy answer': 'Скопировать ответ',

  // Notes and clipboard
  Notes: 'Заметки',
  'No notes yet': 'Заметок пока нет',
  'Write a note and press Enter': 'Напишите заметку и нажмите Enter',
  'Add note': 'Добавить',
  'Delete note': 'Удалить',
  'Ship the island build on Friday': 'Выпустить сборку острова в пятницу',
  'Ask Anna for the new icon set': 'Попросить у Анны новые иконки',
  'Call the studio about the new cover': 'Позвонить в студию насчёт обложки',
  'Buy coffee beans': 'Купить кофе в зёрнах',
  Clipboard: 'Буфер обмена',
  'Clipboard is empty': 'Буфер пуст',
  'Clear history': 'Очистить историю',
  'Copy something and it will appear here': 'Скопируйте что-нибудь, и оно появится здесь',
  'Link copied': 'Ссылка скопирована',
  'Link copied to clipboard': 'Ссылка скопирована в буфер',

  // Upload and download
  'Drop files or click to choose': 'Перетащите файлы или нажмите',

  // Meeting
  'Design review': 'Дизайн-ревью',
  Join: 'Войти',
  'Joined the meeting': 'Вы на встрече',

  // Weather and match
  Rain: 'Дождь',
  'Raining now': 'Идёт дождь',
  'Clear all day': 'Ясно весь день',
  Cloudy: 'Облачно',
  Moscow: 'Москва',
  Goal: 'Гол',

  // System alerts
  Charging: 'Зарядка',
  'Low battery': 'Низкий заряд',
  Battery: 'Батарея',
  'Welcome back': 'С возвращением',
  'Looking for you': 'Ищу вас',
  'Screenshot saved': 'Снимок сохранён',
  'Copied to clipboard · Pictures': 'В буфере · Изображения',
  Earlier: 'Раньше',
  Later: 'Позже',

  // Notification samples
  'The new animations look great. Ship it?': 'Новые анимации отличные. Выпускаем?',
  'Max: pushed the new island build, take a look': 'Max: залил новую сборку острова, посмотри',
  'Kira is now playing': 'Kira сейчас играет',
  'Hades II · Join game': 'Hades II · Присоединиться',
  'Weekly report': 'Отчёт за неделю',
  'Your dictation stats for this week are ready': 'Статистика диктовки за неделю готова',

  // Hub
  Music: 'Музыка',
  Note: 'Заметка',
  Dictate: 'Диктовка',
  Record: 'Запись',
  Upload: 'Файлы',
  Quiet: 'Тишина',
  Clips: 'Буфер',
  Night: 'Ночь',

  // Activity titles and descriptions
  'Now playing': 'Сейчас играет',
  'Music from any player. The island takes the colour of the app it comes from.':
    'Музыка из любого плеера. Остров принимает цвет приложения, из которого она играет.',
  'Incoming calls and voice channels: who is talking, mute, deafen and leave.':
    'Входящие звонки и голосовые каналы: кто говорит, микрофон, звук и выход.',
  Download: 'Загрузка',
  'A browser or Steam download with speed, pause and cancel.':
    'Загрузка из браузера или Steam: скорость, пауза и отмена.',
  'System monitor': 'Системный монитор',
  'Processor, graphics and memory load, pinned while something heavy runs.':
    'Нагрузка на процессор, видеокарту и память, пока работает что-то тяжёлое.',
  'Game mode': 'Игровой режим',
  'Frame rate, GPU temperature, ping and session time while you play.':
    'FPS, температура видеокарты, пинг и время сессии во время игры.',
  Meeting: 'Встреча',
  'The next calendar event with a countdown and a Join button.':
    'Ближайшее событие календаря с обратным отсчётом и кнопкой «Войти».',
  'Focus timer': 'Помодоро',
  'Pomodoro rounds: the island turns red for work and green for a break.':
    'Раунды помодоро: остров красный во время работы и зелёный на перерыве.',
  'Clipboard history': 'История буфера',
  'The last five things you copied. Click one to copy it again.':
    'Последние пять скопированных элементов. Нажмите, чтобы скопировать снова.',
  Weather: 'Погода',
  'A heads-up before the rain, with the chance of rain for the next hours.':
    'Предупреждение перед дождём и вероятность осадков на ближайшие часы.',
  'Live match': 'Матч в эфире',
  'A live score on the island. A goal rolls the digits and bumps the island.':
    'Счёт матча на острове. При голе цифры прокручиваются, а остров вздрагивает.',
  'Exchange rate': 'Курс',
  'A currency or coin you follow, with the change for the day.':
    'Валюта или монета, за которой вы следите, с изменением за день.',
  'AI assistant': 'ИИ-ассистент',
  'Shows that a model is thinking, streams the answer, then says it is ready.':
    'Показывает, что модель думает, выводит ответ по мере генерации и сообщает о готовности.',
  Dictation: 'Диктовка',
  'Listens, transcribes and inserts text. The reveal style is a setting.':
    'Слушает, распознаёт и вставляет текст. Способ появления слов настраивается.',
  'Pinned notes. Type in the expanded view; new notes slide into the list.':
    'Закреплённые заметки. Пишите в раскрытом виде, новые заметки въезжают в список.',
  'File upload': 'Загрузка файлов',
  'Drag files onto the window: the island opens a drop target, then tracks progress.':
    'Перетащите файлы в окно: остров раскроет зону сброса и покажет прогресс.',
  'Countdown with a progress ring, pause and cancel.': 'Обратный отсчёт с кольцом прогресса, паузой и отменой.',
  'Screen recording': 'Запись экрана',
  'Elapsed time with a live level and a stop control.': 'Время записи, уровень звука и кнопка остановки.',
  Notification: 'Уведомление',
  'Banners from apps. Several in a row stack up and can be flipped through or swiped.':
    'Баннеры приложений. Несколько подряд складываются в стопку, её можно листать кнопками или свайпом.',
  Volume: 'Громкость',
  'Level that updates in place: showing it again moves the bar.':
    'Уровень обновляется на месте: повторный показ просто двигает полосу.',
  Brightness: 'Яркость',
  'Display brightness with a sun that turns as the level changes.':
    'Яркость экрана с солнцем, которое поворачивается вместе с уровнем.',
  'Charging and low battery states with a level that fills in.':
    'Зарядка и низкий заряд с заполняющимся индикатором.',
  'Device connected': 'Устройство подключено',
  'Headphones, a controller, a USB drive or a network, with battery where there is one.':
    'Наушники, геймпад, флешка или сеть. Заряд показывается там, где он есть.',
  'Confirms that something was copied, with a check that draws itself.':
    'Подтверждает копирование галочкой, которая рисуется сама.',
  Status: 'Статус',
  'Success, error and info results. An error shakes the island.':
    'Успех, ошибка и информация. При ошибке остров качает «головой».',
  'Sign in confirmation: the lock opens with a small bump.': 'Подтверждение входа: замок открывается с лёгким толчком.',
  'Keyboard layout': 'Раскладка',
  'Shows the input language when it is switched with Win + Space or Alt + Shift.':
    'Показывает язык ввода при переключении через Win + Пробел или Alt + Shift.',
  'Tells you when Caps Lock or Num Lock turns on or off.': 'Сообщает, когда включается или выключается Caps Lock или Num Lock.',
  Screenshot: 'Снимок экрана',
  'Confirms a capture from Win + Shift + S with a preview.': 'Подтверждает снимок через Win + Shift + S и показывает превью.',

  // Demo presets and controls
  Start: 'Запустить',
  Show: 'Показать',
  'Open / close': 'Открыть / закрыть',
  End: 'Завершить',
  '5 min': '5 мин',
  '10 sec': '10 сек',
  'Pause / resume': 'Пауза / продолжить',
  '25 / 5 min': '25 / 5 мин',
  'Demo 8 / 5 s': 'Демо 8 / 5 с',
  'Next phase': 'Следующая фаза',
  'Play / pause': 'Играть / пауза',
  'Next track': 'Следующий трек',
  'Incoming call': 'Входящий звонок',
  'Voice channel': 'Голосовой канал',
  Caller: 'Кто звонит',
  Muted: 'Микрофон выкл.',
  'Hold state': 'Удерживать',
  Error: 'Ошибка',
  Phase: 'Фаза',
  'Advance automatically': 'Переключать автоматически',
  'Add a sample note': 'Добавить пример заметки',
  'Drop target': 'Зона сброса',
  'Upload 3 files': 'Загрузить 3 файла',
  'Add files': 'Добавить файлы',
  'In 10 minutes': 'Через 10 минут',
  'In 10 seconds': 'Через 10 секунд',
  Title: 'Название',
  'Copy a sample': 'Скопировать пример',
  'Rain soon': 'Скоро дождь',
  Clear: 'Ясно',
  'Home goal': 'Гол хозяев',
  'Away goal': 'Гол гостей',
  Ask: 'Спросить',
  Label: 'Текст',
  Level: 'Уровень',
  Success: 'Успех',
  Info: 'Инфо',
  Headphones: 'Наушники',
  Controller: 'Геймпад',
  'USB drive': 'Флешка',
  'Caps on': 'Caps вкл',
  'Caps off': 'Caps выкл',
  'Three layouts': 'Три раскладки',
  Name: 'Имя',

  // Playground: navigation and stage
  Island: 'Остров',
  Apps: 'Приложения',
  Activities: 'Активности',
  Motion: 'Анимация',
  Behavior: 'Поведение',
  Idle: 'Покой',
  'Two apps': 'Два приложения',
  Expanded: 'Раскрыт',
  Recording: 'Запись',
  Hub: 'Хаб',
  Alert: 'Уведомление',
  'Play tour': 'Показать всё',
  'Click, hold, swipe or scroll on the island': 'Клик, удержание, свайп и колёсико работают на острове',

  // Playground: apps page
  'Connected apps': 'Подключённые приложения',
  'each app tints the island with its own colour': 'каждое приложение окрашивает остров в свой цвет',
  'Calls, voice channels and mentions': 'Звонки, голосовые каналы и упоминания',
  'Join voice': 'Войти в канал',
  Mention: 'Упоминание',
  'Three in a row': 'Три подряд',
  'Whatever plays in the browser tab or the app': 'Всё, что играет во вкладке браузера или в приложении',
  'Desktop app playback': 'Воспроизведение в приложении',
  'Upcoming meetings': 'Ближайшие встречи',
  'Meeting in 10 min': 'Встреча через 10 мин',
  'Starting now': 'Начинается сейчас',
  'Video and music in the browser': 'Видео и музыка в браузере',
  'New messages': 'Новые сообщения',
  Message: 'Сообщение',
  'Downloads and friends': 'Загрузки и друзья',
  'Game download': 'Загрузка игры',
  'Friend playing': 'Друг в игре',
  'File downloads': 'Загрузки файлов',
  'System events': 'Системные события',
  'Switch layout': 'Сменить раскладку',
  'These events are simulated. In the Windows app, music comes from the system media session and the rest from notifications and each app.':
    'Эти события смоделированы. В приложении для Windows музыка придёт из системной медиасессии, остальное из уведомлений и самих приложений.',

  // Playground: activities page
  'Live activities': 'Живые активности',
  'stay on the island until they end': 'остаются на острове, пока не закончатся',
  Alerts: 'Оповещения',
  'take over for a moment, then leave': 'появляются на мгновение и уходят',
  Gestures: 'Жесты',
  Bump: 'Толчок',
  Shake: 'Тряска',
  'Expand / collapse': 'Раскрыть / свернуть',
  'End everything': 'Завершить всё',

  // Playground: island page
  'Ready styles': 'Готовые стили',
  Signal: 'Сигнал',
  Neon: 'Неон',
  Glass: 'Стекло',
  Paper: 'Бумага',
  Capsule: 'Капсула',
  'Your theme': 'Своя тема',
  'make it yours and share it as a file': 'настройте под себя и сохраните в файл',
  'Island colour': 'Цвет острова',
  'Text turns dark on its own when the colour is light': 'На светлом цвете текст сам становится тёмным',
  'Accent colour': 'Цвет акцента',
  'Any colour, not only the ready ones': 'Любой цвет, не только готовые',
  Backdrop: 'Фон',
  'A colour or your own wallpaper behind the island': 'Цвет или свои обои за островом',
  'Choose image': 'Выбрать картинку',
  'Theme file': 'Файл темы',
  'Everything on this page plus the backdrop, in one file': 'Всё с этой страницы и фон в одном файле',
  'That file is not an island theme': 'Этот файл не является темой острова',
  Export: 'Экспорт',
  Import: 'Импорт',
  Look: 'Вид',
  Surface: 'Поверхность',
  Custom: 'Свой цвет',
  Mica: 'Слюда',
  Black: 'Чёрный',
  Graphite: 'Графит',
  Light: 'Светлый',
  Accent: 'Акцент',
  'Waves, progress and the dictation dot': 'Волны, прогресс и точка диктовки',
  'Follow text': 'Как текст',
  Blue: 'Голубой',
  Mint: 'Мятный',
  Lilac: 'Сиреневый',
  Pink: 'Розовый',
  Amber: 'Янтарный',
  Coral: 'Коралловый',
  Sand: 'Песочный',
  'Wave style': 'Стиль волны',
  Bars: 'Полосы',
  Dots: 'Точки',
  Line: 'Линия',
  'Edge light': 'Подсветка края',
  'A line of light along the bottom edge in the colour of the running app':
    'Линия света по нижнему краю в цвете активного приложения',
  Glow: 'Свечение',
  'A halo around the island in the same colour': 'Ореол вокруг острова того же цвета',
  Outline: 'Контур',
  'A hairline that separates the island from dark backgrounds': 'Тонкая линия, отделяющая остров от тёмного фона',
  Shadow: 'Тень',
  Shape: 'Форма',
  Roundness: 'Скругление',
  'From a tight tab to a full capsule': 'От строгой плашки до полной капсулы',
  Attachment: 'Крепление',
  'Docked grows out of the screen edge, floating hangs below it':
    'Пристыкованный растёт из края экрана, парящий висит под ним',
  Docked: 'У края',
  Floating: 'Парящий',
  Size: 'Размер',
  'Corner smoothing': 'Сглаживание углов',

  // Playground: motion page
  Feel: 'Характер',
  Smooth: 'Плавно',
  'As designed': 'Как задумано',
  Snappy: 'Резко',
  'Quick, no overshoot': 'Быстро, без перелёта',
  Bouncy: 'Упруго',
  'Playful overshoot': 'Игривый перелёт',
  Calm: 'Спокойно',
  'Slow and soft': 'Медленно и мягко',
  Tuning: 'Настройка',
  Bounce: 'Упругость',
  'How far the shape overshoots before it settles': 'Насколько форма перелетает, прежде чем успокоиться',
  Duration: 'Длительность',
  'Slow everything down to inspect a transition frame by frame': 'Замедлите всё, чтобы рассмотреть переход по кадрам',
  'Soft focus': 'Мягкий фокус',
  'Content blurs while it swaps': 'Содержимое размывается при смене',
  'Reduced motion': 'Меньше движения',
  'Keeps fades, drops travel, scale and overshoot': 'Оставляет затухания, убирает смещения, масштаб и перелёт',
  System: 'Система',
  Always: 'Всегда',
  Never: 'Никогда',
  Text: 'Текст',
  'How words appear': 'Как появляются слова',
  'Used by dictation': 'Используется в диктовке',
  Letters: 'Буквы',
  Words: 'Слова',

  // Playground: behaviour page
  Interaction: 'Взаимодействие',
  'Open on': 'Открывать по',
  'Hover opens after a short rest and closes when the pointer leaves':
    'Наведение открывает после короткой паузы и закрывает, когда курсор уходит',
  Click: 'Клику',
  Hover: 'Наведению',
  Settings: 'Настройки',
  'Restore defaults': 'Вернуть по умолчанию',
  'Settings are saved in this browser': 'Настройки хранятся в этом браузере',
  Reset: 'Сбросить',
};

function files(count: number): string {
  const tens = count % 100;
  const ones = count % 10;
  if (tens >= 11 && tens <= 14) return `${count} файлов`;
  if (ones === 1) return `${count} файл`;
  if (ones >= 2 && ones <= 4) return `${count} файла`;
  return `${count} файлов`;
}

/** Strings with a variable part. */
export const RU_PATTERNS: [RegExp, (match: RegExpExecArray) => string][] = [
  [/^Uploading (\d+) files?$/, (m) => `Загружаю ${files(Number(m[1]))}`],
  [/^(\d+) files? uploaded$/, (m) => `Загружено: ${files(Number(m[1]))}`],
  [/^(.+) downloaded$/, (m) => `${m[1]}: загружено`],
  [/^Rain in (\d+) min$/, (m) => `Дождь через ${m[1]} мин`],
];
