/**
 * Wikiすごろく - Wikipedia Board Game Engine (iframe mode)
 *
 * Uses Wikipedia's mobile HTML endpoint to render articles,
 * and intercepts link clicks for game movement.
 */

const BOARD_SIZE = 9;

// --- API Clients ---

const BoardGenerator = {
    async getRandomArticles(count) {
        const url = `https://ja.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=${count}&format=json&origin=*`;
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) throw new Error(`Wikipedia random API error: ${res.status}`);
        const data = await res.json();
        return data.query.random.map(r => r.title);
    },

    // 209 articles: Wikidata sitelinks>250, countries limited to top 30
    EASY_POOL: [
        'Facebook', 'アイザック・ニュートン', 'アジア', 'アテネ', 'アドルフ・ヒトラー', 'アフリカ',
        'アムステルダム', 'アメリカ合衆国', 'アリストテレス', 'アルゼンチン', 'アルベルト・アインシュタイン', 'アレクサンドロス3世',
        'イエス・キリスト', 'イギリス', 'イスタンブール', 'イスラム教', 'イタリア', 'イヌ',
        'インターネット', 'インド', 'インドネシア', 'ウィリアム・シェイクスピア', 'ウィンストン・チャーチル', 'ウィーン',
        'ウシ', 'ウマ', 'ウラジーミル・プーチン', 'ウラジーミル・レーニン', 'エイブラハム・リンカーン', 'エジプト',
        'エスペラント', 'エリザベス2世', 'エルサレム', 'オセアニア', 'オランダ', 'オーストラリア',
        'カイロ', 'カナダ', 'カール・マルクス', 'ガイウス・ユリウス・カエサル', 'ガリレオ・ガリレイ', 'キリスト教',
        'キーウ', 'ギリシャ', 'クリスマス', 'クルアーン', 'コンピュータ', 'コーヒー',
        'サウジアラビア', 'サッカー', 'サンクトペテルブルク', 'サンティアゴ (チリ)', 'サンパウロ', 'シカゴ',
        'シドニー', 'シンガポール', 'ジョージア (国)', 'ジョージ・W・ブッシュ', 'ジョージ・ワシントン', 'ジョー・バイデン',
        'スイス', 'スウェーデン', 'ストックホルム', 'スペイン', 'スポーツ', 'ソウル特別市',
        'ソクラテス', 'ソビエト連邦', 'タイ王国', 'ダンテ・アリギエーリ', 'チェス', 'チャールズ・ダーウィン',
        'チャールズ・チャップリン', 'テレビ', 'トルコ', 'ドイツ', 'ドナルド・トランプ', 'ナポレオン・ボナパルト',
        'ニュージーランド', 'ニューヨーク', 'ネコ', 'ネルソン・マンデラ', 'ノルウェー', 'バラク・オバマ',
        'バンコク', 'パブロ・ピカソ', 'パリ', 'ヒト', 'ヒンドゥー教', 'フィリピン',
        'フィンセント・ファン・ゴッホ', 'フランス', 'フリードリヒ・ニーチェ', 'ブエノスアイレス', 'ブダペスト', 'ブラジル',
        'プラトン', 'プラハ', 'ヘルシンキ', 'ベトナム', 'ベルリン', 'ホメーロス',
        'ホーチミン市', 'ボゴタ', 'ポーランド', 'マイケル・ジャクソン', 'マドリード', 'マハトマ・ガンディー',
        'マルティン・ルター', 'ミケランジェロ・ブオナローティ', 'ムスタファ・ケマル・アタテュルク', 'ムハンマド・イブン＝アブドゥッラーフ', 'メキシコ', 'メキシコシティ',
        'モスクワ', 'ユダヤ教', 'ヨシフ・スターリン', 'ヨハン・ゼバスティアン・バッハ', 'ヨハン・ヴォルフガング・フォン・ゲーテ', 'ヨーロッパ',
        'ライオン', 'リオデジャネイロ', 'リスボン', 'ルートヴィヒ・ヴァン・ベートーヴェン', 'レオナルド・ダ・ヴィンチ', 'レフ・トルストイ',
        'ロサンゼルス', 'ロシア', 'ロナルド・レーガン', 'ロンドン', 'ローマ', 'ワシントンD.C.',
        'ワルシャワ', 'ヴィクトル・ユーゴー', 'ヴォルテール', 'ヴォルフガング・アマデウス・モーツァルト', '中華人民共和国', '乳',
        '京都市', '仏教', '動物', '化学', '北アメリカ', '北京市',
        '南アメリカ', '南極大陸', '哲学', '唯一神', '国際連合', '土星',
        '地中海', '地球', '地理学', '大洋', '大西洋', '大韓民国',
        '天文学', '天王星', '太平洋', '太陽', '太陽系', '女性',
        '孔子', '宗教', '川', '心臓', '恒星', '惑星',
        '戦争', '政治', '教育', '数学', '文化', '文学',
        '日本', '時間', '月', '木', '木星', '本',
        '東京都', '植物', '欧州連合', '歴史', '民主主義', '水',
        '水星', '海', '火星', '物理学', '生物学', '目',
        '科学', '第一次世界大戦', '第二次世界大戦', '聖書', '芸術', '茶',
        '貨幣', '都市', '釈迦', '金', '金星', '雨',
        '音楽', '香港', '魚類', '鳥類',
    ],

    async getWikidataInfoBatch(titles) {
        const values = titles.map(t => `"${t.replace(/"/g, '\\"')}"@ja`).join(' ');
        const sparql = `SELECT ?jaTitle ?sl ?classLabel WHERE {
  VALUES ?jaTitle { ${values} }
  ?ja schema:isPartOf <https://ja.wikipedia.org/> ;
      schema:name ?jaTitle ;
      schema:about ?item .
  ?item wikibase:sitelinks ?sl .
  OPTIONAL { ?item wdt:P31 ?class . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ja,en". }
} GROUP BY ?jaTitle ?sl ?classLabel`;

        const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
        const res = await fetch(url, {
            headers: { 'Accept': 'application/sparql-results+json' },
            signal: AbortSignal.timeout(15000)
        });
        if (!res.ok) throw new Error(`SPARQL error: ${res.status}`);
        return res.json();
    },

    async getWikidataInfo(titles) {
        const BATCH_SIZE = 30;
        const batches = [];
        for (let i = 0; i < titles.length; i += BATCH_SIZE) {
            batches.push(titles.slice(i, i + BATCH_SIZE));
        }
        const results = await Promise.all(batches.map(b => this.getWikidataInfoBatch(b)));

        const map = new Map();
        for (const data of results) {
            for (const b of data.results.bindings) {
                const title = b.jaTitle.value;
                if (!map.has(title)) {
                    map.set(title, {
                        name: title,
                        genre: b.classLabel?.value || '記事',
                        sitelinks: parseInt(b.sl.value),
                        isStart: null
                    });
                }
            }
        }
        return map;
    },

    assignPointsBySitelinks(articles) {
        const scoring = articles.filter(a => !a.isStart);
        // Sort by sitelinks descending (most famous first)
        scoring.sort((a, b) => b.sitelinks - a.sitelinks);
        const n = scoring.length;
        // Cumulative log-gap: position based on actual sitelink distances
        const logs = scoring.map(a => Math.log(Math.max(a.sitelinks, 1)));
        const totalRange = (logs[0] - logs[n - 1]) || 1;
        scoring.forEach((a, i) => {
            const t = (logs[0] - logs[i]) / totalRange; // 0 (famous) → 1 (obscure)
            // Sigmoid squeeze: bunches toward center (normal-like)
            const squeezed = 1 / (1 + Math.exp(-5 * (t - 0.5)));
            a.points = Math.max(1, Math.min(7, Math.round(1 + squeezed * 6)));
        });
    },

    DIFFICULTY: {
        easy:   { minSitelinks: 5, fetchCount: 50, maxTurns: 15 },
        normal: { minSitelinks: 10, fetchCount: 40, maxTurns: 10 },
        hard:   { minSitelinks: 3,  fetchCount: 30, maxTurns: 8 },
    },

    MAX_RETRIES: 3,

    async generateBoard(onProgress, difficulty = 'normal') {
        const conf = this.DIFFICULTY[difficulty] || this.DIFFICULTY.normal;

        let titles;
        if (difficulty === 'easy') {
            onProgress('記事を選出中...');
            const pool = [...this.EASY_POOL];
            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }
            titles = pool.slice(0, 30);
        } else {
            titles = await this.fetchRandomTitles(onProgress, conf);
        }

        onProgress('記事情報を取得中...');
        const infoMap = await this.getWikidataInfo(titles);
        const candidates = [...infoMap.values()]
            .filter(a => a.sitelinks > conf.minSitelinks)
            .sort((a, b) => b.sitelinks - a.sitelinks);

        if (candidates.length < BOARD_SIZE) {
            throw new Error(`記事が足りません (${candidates.length}/${BOARD_SIZE})。もう一度お試しください`);
        }

        const articles = candidates.slice(0, BOARD_SIZE);
        articles[0].isStart = 'red';
        articles[1].isStart = 'blue';
        this.assignPointsBySitelinks(articles);

        onProgress('盤面生成完了');
        return articles;
    },

    async fetchRandomTitles(onProgress, conf) {
        const allTitles = new Set();
        for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
            onProgress(attempt === 0 ? '記事を取得中...' : `記事を追加取得中... (${attempt + 1}/${this.MAX_RETRIES})`);
            const [t1, t2] = await Promise.all([
                this.getRandomArticles(conf.fetchCount),
                this.getRandomArticles(conf.fetchCount)
            ]);
            for (const t of t1) allTitles.add(t);
            for (const t of t2) allTitles.add(t);
            if (allTitles.size >= conf.fetchCount * 2) break;
        }
        return [...allTitles];
    }
};

const WikipediaAPI = {
    async getArticle(articleName) {
        const encoded = encodeURIComponent(articleName);
        const url = `https://ja.wikipedia.org/w/api.php?action=parse&page=${encoded}&prop=links|text&format=json&origin=*`;
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) throw new Error(`Wikipedia API error: ${res.status}`);
        const data = await res.json();
        if (!data.parse) return { links: [], title: articleName, html: '' };
        const links = (data.parse.links || [])
            .filter(l => l.ns === 0 && Object.hasOwn(l, 'exists'))
            .map(l => l['*']);
        const title = data.parse.title;
        const html = data.parse.text?.['*'] || '';
        return { links, title, html };
    }
};

// --- Game State ---

class GameState {
    constructor(board, maxTurns) {
        this.maxTurns = maxTurns;
        this.board = board;
        this.board.forEach(a => a.owner = null);

        const redStart = board.find(a => a.isStart === 'red');
        const blueStart = board.find(a => a.isStart === 'blue');

        this.startNames = { red: redStart.name, blue: blueStart.name };
        this.players = {
            red: { pos: redStart.name, score: 0, visited: new Set([redStart.name]) },
            blue: { pos: blueStart.name, score: 0, visited: new Set([blueStart.name]) }
        };

        this.currentPlayer = 'red';
        this.turnCount = { red: 0, blue: 0 };
        this.phase = 'playing';
        this.moveLog = [];
    }

    get opponent() {
        return this.currentPlayer === 'red' ? 'blue' : 'red';
    }

    get currentTurnNumber() {
        return Math.max(this.turnCount.red, this.turnCount.blue) + 1;
    }

    isBlocked(name) {
        return this.players[this.opponent].visited.has(name);
    }

    findScoringArticle(name) {
        return this.board.find(a => a.name === name && !a.isStart && !a.owner);
    }

    executeMove(articleName) {
        const player = this.players[this.currentPlayer];
        const from = player.pos;
        player.pos = articleName;
        player.visited.add(articleName);
        this.turnCount[this.currentPlayer]++;

        let scored = false;
        let points = 0;
        const target = this.findScoringArticle(articleName);
        if (target) {
            target.owner = this.currentPlayer;
            points = target.points;
            player.score += points;
            scored = true;
        }

        this.moveLog.push({
            player: this.currentPlayer,
            from, to: articleName,
            scored, points,
            turn: this.turnCount[this.currentPlayer]
        });

        const allScored = this.board.filter(a => !a.isStart).every(a => a.owner);
        const maxTurns = this.turnCount.red >= this.maxTurns && this.turnCount.blue >= this.maxTurns;
        if (allScored || maxTurns) {
            this.phase = 'ended';
        } else {
            this.currentPlayer = this.opponent;
        }

        return { scored, points };
    }

    getResult() {
        const r = this.players.red.score;
        const b = this.players.blue.score;
        if (r > b) return { winner: 'red', red: r, blue: b };
        if (b > r) return { winner: 'blue', red: r, blue: b };
        return { winner: 'draw', red: r, blue: b };
    }
}

// --- UI ---

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

class GameUI {
    constructor() {
        this.game = null;
        this.pendingMove = null;
        this.validLinks = new Set();
    }

    init() {
        this.els = {
            setup: document.getElementById('setup'),
            btnGenerate: document.getElementById('btn-generate'),
            progress: document.getElementById('progress'),
            gameScreen: document.getElementById('game-screen'),
            wikiFrame: document.getElementById('wiki-frame'),
            turnInfo: document.getElementById('turn-info'),
            currentPos: document.getElementById('current-pos'),
            btnConfirm: document.getElementById('btn-confirm'),
            navStatus: document.getElementById('nav-status'),
            turnsLeft: document.getElementById('turns-left'),
            boardGrid: document.getElementById('board-grid'),
            timeline: document.getElementById('timeline'),
            redScore: document.getElementById('red-score'),
            blueScore: document.getElementById('blue-score'),
            redCard: document.getElementById('red-card'),
            blueCard: document.getElementById('blue-card'),
            resultOverlay: document.getElementById('result-overlay'),
            resultTitle: document.getElementById('result-title'),
            resultScore: document.getElementById('result-score'),
            btnReplay: document.getElementById('btn-replay'),
            btnReplay2: document.getElementById('btn-replay2')
        };

        this.els.btnGenerate.addEventListener('click', () => this.startNewGame());
        this.els.btnConfirm.addEventListener('click', () => this.confirmMove());
        this.els.btnReplay.addEventListener('click', () => this.reset());
        this.els.btnReplay2.addEventListener('click', () => this.reset());
        this.els.resultOverlay.addEventListener('click', (e) => {
            if (e.target === this.els.resultOverlay) this.els.resultOverlay.classList.remove('active');
        });

        // Single permanent message handler for iframe communication
        window.addEventListener('message', (e) => {
            if (e.data && e.data.type === 'wikiMove') {
                this.onLinkClicked(e.data.article);
            }
        });

        // Resizer drag
        this.initResizer();
    }

    initResizer() {
        const resizer = document.getElementById('resizer');
        const screen = this.els.gameScreen;
        const frame = this.els.wikiFrame;

        const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

        resizer.addEventListener('pointerdown', (e) => {
            resizer.setPointerCapture(e.pointerId);
            resizer.classList.add('active');
            frame.style.pointerEvents = 'none';
            e.preventDefault();
        });

        resizer.addEventListener('pointermove', (e) => {
            if (!resizer.hasPointerCapture(e.pointerId)) return;
            if (e.cancelable) e.preventDefault();

            if (isMobile()) {
                const h = Math.max(150, Math.min(e.clientY, window.innerHeight - 150));
                screen.style.gridTemplateRows = `${h}px 6px 1fr`;
            } else {
                const w = screen.getBoundingClientRect().width;
                const left = Math.max(300, Math.min(e.clientX, w - 200));
                screen.style.gridTemplateColumns = `${left}px 6px 1fr`;
            }
        });

        resizer.addEventListener('pointerup', () => {
            resizer.classList.remove('active');
            frame.style.pointerEvents = '';
        });
    }

    hideConfirmButton() {
        this.els.btnConfirm.style.display = 'none';
        this.els.btnConfirm.classList.remove('scoring-cta');
        this.els.btnConfirm.closest('.header-action')?.classList.remove('visible');
    }

    async startNewGame() {
        this.els.btnGenerate.disabled = true;
        this.els.progress.textContent = '準備中...';
        const difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || 'normal';

        try {
            const board = await BoardGenerator.generateBoard(msg => {
                this.els.progress.textContent = msg;
            }, difficulty);

            const endless = document.getElementById('endless-mode').checked;
            const { maxTurns } = BoardGenerator.DIFFICULTY[difficulty] || BoardGenerator.DIFFICULTY.normal;
            this.game = new GameState(board, endless ? Infinity : maxTurns);
            this.els.setup.style.display = 'none';
            this.els.gameScreen.classList.add('active');
            // Keep screen awake during gameplay
            if (navigator.wakeLock) {
                navigator.wakeLock.request('screen').then(lock => {
                    this._wakeLock = lock;
                }).catch(() => {});
            }
            this.renderBoard();
            this.renderScores();
            this.renderTimeline();
            this.startTurn();
        } catch (e) {
            this.els.progress.textContent = `エラー: ${e.message}`;
            this.els.btnGenerate.disabled = false;
        }
    }

    reset() {
        if (this._wakeLock) {
            this._wakeLock.release().catch(() => {});
            this._wakeLock = null;
        }
        this.game = null;
        this.pendingMove = null;
        this.validLinks = new Set();
        this.els.setup.style.display = '';
        this.els.btnGenerate.disabled = false;
        this.els.progress.textContent = '';
        this.els.gameScreen.classList.remove('active');
        this.els.resultOverlay.classList.remove('active');
        this.hideConfirmButton();
        this.els.boardGrid.innerHTML = '';
        this.els.timeline.innerHTML = '';
        this.els.wikiFrame.srcdoc = '';
    }

    renderBoard() {
        this.els.boardGrid.innerHTML = this.game.board.map(article => {
            let cls = 'board-card';
            let extra = '';
            if (article.isStart === 'red') {
                cls += ' start';
                extra = `<div class="start-label">Red</div>`;
            } else if (article.isStart === 'blue') {
                cls += ' start';
                extra = `<div class="start-label">Blue</div>`;
            } else if (article.owner) {
                cls += ' owned';
            }
            const dataPlayer = article.isStart || article.owner || '';

            let posIndicator = '';
            if (this.game.players.red.pos === article.name) posIndicator += '<span class="pos-indicator" data-player="red" style="color:var(--player-color)">&#9679;</span>';
            if (this.game.players.blue.pos === article.name) posIndicator += '<span class="pos-indicator" data-player="blue" style="color:var(--player-color);left:60%">&#9679;</span>';

            const badge = !article.isStart ? `<span class="point-badge">${article.points}</span>` : '';

            return `<div class="${cls}"${dataPlayer ? ` data-player="${dataPlayer}"` : ''}>
                ${badge}
                <div class="article-name">${escapeHtml(article.name)}</div>
                <div class="genre-label">${escapeHtml(article.genre)}</div>
                ${extra}
                ${posIndicator}
            </div>`;
        }).join('');
    }

    renderScores() {
        const cur = this.game.currentPlayer;
        this.els.redScore.textContent = this.game.players.red.score;
        this.els.blueScore.textContent = this.game.players.blue.score;
        this.els.redCard.className = `score-card${cur === 'red' ? ' current' : ''}`;
        this.els.blueCard.className = `score-card${cur === 'blue' ? ' current' : ''}`;
    }

    renderTurnInfo() {
        const g = this.game;
        const name = g.currentPlayer === 'red' ? 'Red' : 'Blue';
        const el = this.els.turnInfo;
        el.className = 'turn-badge';
        el.dataset.player = g.currentPlayer;
        el.textContent = `${name} の番`;

        if (g.maxTurns === Infinity) {
            this.els.turnsLeft.textContent = `T${g.turnCount[g.currentPlayer] + 1}`;
        } else {
            const remaining = g.maxTurns - g.turnCount[g.currentPlayer];
            this.els.turnsLeft.textContent = `残り${remaining}手`;
        }
    }

    async startTurn() {
        if (this.game.phase === 'ended') {
            this.showResult();
            return;
        }

        this.pendingMove = null;
        this.renderScores();
        this.renderTurnInfo();
        this.renderBoard();

        const pos = this.game.players[this.game.currentPlayer].pos;
        this.els.currentPos.textContent = pos;
        this.hideConfirmButton();
        this.els.navStatus.textContent = '記事を読み込み中...';
        this.els.navStatus.className = 'nav-status';

        const article = await WikipediaAPI.getArticle(pos);

        this.validLinks = new Set(article.links);
        this.els.navStatus.textContent = 'リンクをクリックして移動先を選択';

        if (article.html) {
            this.renderArticle(article.title, article.html);
        }
    }

    renderArticle(title, html) {
        const blocked = this.game.players[this.game.opponent].visited;
        const scoring = new Map();
        this.game.board.filter(a => !a.isStart && !a.owner).forEach(a => scoring.set(a.name, a.points));

        const srcdoc = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body {
    font-family: 'Noto Sans JP', sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem 1.5rem 4rem;
    font-size: 15px;
    line-height: 1.7;
    color: #18181b;
}
h1 { font-size: 1.75rem; border-bottom: 1px solid #e4e4e7; padding-bottom: 0.5rem; margin-bottom: 1rem; }
a { color: #0645ad; text-decoration: underline; cursor: pointer; }
a:hover { color: #0b0080; }
a.scoring { background: #fef3c7; border-radius: 2px; }
a.blocked, a.invalid { color: #6b7280; text-decoration: none; pointer-events: none; cursor: default; }
img { max-width: 100%; height: auto; }
table { border-collapse: collapse; margin: 1rem 0; width: 100%; }
td, th { border: 1px solid #e4e4e7; padding: 0.375rem 0.5rem; font-size: 0.875rem; }
.infobox { float: right; margin: 0 0 1rem 1rem; max-width: 300px; font-size: 0.8rem; }
.mw-editsection, .mw-empty-elt, .noprint { display: none; }
.navbox, .catlinks, #toc { display: none; }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
${html}
<script>
const blocked = ${JSON.stringify([...blocked])};
const blockedSet = new Set(blocked);
const scoring = ${JSON.stringify(Object.fromEntries(scoring))};
document.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (!href.startsWith('/wiki/')) {
        if (href.startsWith('#')) return;
        a.classList.add('invalid');
        a.removeAttribute('href');
        return;
    }
    const pageName = decodeURIComponent(href.replace('/wiki/', '').replace(/_/g, ' '));
    if (blockedSet.has(pageName)) {
        a.classList.add('blocked');
        a.removeAttribute('href');
        return;
    }
    if (scoring[pageName]) {
        a.classList.add('scoring');
        a.title = '得点記事 +' + scoring[pageName] + 'pt';
    }
    a.removeAttribute('href');
    a.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({ type: 'wikiMove', article: pageName }, '*');
    });
});
<\/script>
</body>
</html>`;

        this.els.wikiFrame.srcdoc = srcdoc;
    }

    onLinkClicked(articleName) {
        if (!this.game || this.game.phase !== 'playing') return;

        if (!this.validLinks.has(articleName)) {
            this.els.navStatus.textContent = `${articleName} はリンク先にありません`;
            this.els.navStatus.className = 'nav-status blocked';
            return;
        }

        if (this.game.isBlocked(articleName)) {
            this.els.navStatus.textContent = `${articleName} は相手が訪問済み`;
            this.els.navStatus.className = 'nav-status blocked';
            return;
        }

        this.pendingMove = articleName;
        const target = this.game.findScoringArticle(articleName);
        if (target) {
            this.els.btnConfirm.textContent = `${articleName} に移動 (+${target.points}pt!)`;
            this.els.btnConfirm.classList.add('scoring-cta');
            this.els.navStatus.textContent = '得点記事!';
            this.els.navStatus.className = 'nav-status scoring';
        } else {
            this.els.btnConfirm.textContent = `${articleName} に移動する`;
            this.els.btnConfirm.classList.remove('scoring-cta');
            this.els.navStatus.textContent = '';
            this.els.navStatus.className = 'nav-status';
        }
        this.els.btnConfirm.style.display = '';
        this.els.btnConfirm.closest('.header-action')?.classList.add('visible');
    }

    confirmMove() {
        if (!this.pendingMove || !this.game) return;
        this.game.executeMove(this.pendingMove);
        this.renderTimeline();
        this.pendingMove = null;
        this.hideConfirmButton();
        this.startTurn();
    }

    renderTimeline() {
        const g = this.game;
        const maxTurn = Math.max(g.turnCount.red, g.turnCount.blue);
        const grouped = Object.groupBy(g.moveLog, m => m.player);
        const redMoves = grouped.red || [];
        const blueMoves = grouped.blue || [];

        const { red: redStart, blue: blueStart } = g.startNames;
        let html = `<div class="tl-row"><div class="tl-cell" data-player="red">${escapeHtml(redStart)}</div><div class="tl-turn">T0</div><div class="tl-cell" data-player="blue">${escapeHtml(blueStart)}</div></div>`;
        for (let t = 1; t <= maxTurn; t++) {
            const r = redMoves[t - 1];
            const b = blueMoves[t - 1];
            html += `<div class="tl-row">${this.renderTimelineCell(r, 'red')}<div class="tl-turn">T${t}</div>${this.renderTimelineCell(b, 'blue')}</div>`;
        }
        this.els.timeline.innerHTML = html;
    }

    renderTimelineCell(move, player) {
        if (!move) return `<div class="tl-cell empty" data-player="${player}">-</div>`;
        const cls = `tl-cell${move.scored ? ' scored' : ''}`;
        return `<div class="${cls}" data-player="${player}">${escapeHtml(move.to)}${move.scored ? ` ★+${move.points}pt` : ''}</div>`;
    }

    showResult() {
        const result = this.game.getResult();
        let title;
        if (result.winner === 'red') title = 'Red の勝利!';
        else if (result.winner === 'blue') title = 'Blue の勝利!';
        else title = '引き分け!';

        this.els.resultTitle.textContent = title;
        this.els.resultScore.textContent = `Red ${result.red}pt - ${result.blue}pt Blue`;
        this.els.resultOverlay.classList.add('active');
    }
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    const ui = new GameUI();
    ui.init();
});
