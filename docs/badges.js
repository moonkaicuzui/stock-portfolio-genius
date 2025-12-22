// ============================================
// 🏆 업적/배지 시스템
// Version 2.0 - 데이터 무결성 및 접근성 강화
// ============================================

const BadgeSystem = {
    // 시스템 버전 (데이터 마이그레이션용)
    VERSION: '2.0',
    VERSION_KEY: 'spg_badge_version',
    // 배지 정의
    badges: {
        // 🌱 입문자 배지
        first_login: {
            id: 'first_login',
            name: '첫 발걸음',
            icon: '👋',
            description: '포트폴리오 지니어스에 처음 로그인',
            category: 'beginner',
            points: 10
        },
        onboarding_complete: {
            id: 'onboarding_complete',
            name: '준비 완료',
            icon: '🎓',
            description: '온보딩 튜토리얼 완료',
            category: 'beginner',
            points: 20
        },
        first_quiz: {
            id: 'first_quiz',
            name: '퀴즈 도전자',
            icon: '🧠',
            description: '첫 퀴즈 완료',
            category: 'beginner',
            points: 15
        },
        glossary_explorer: {
            id: 'glossary_explorer',
            name: '용어 탐험가',
            icon: '📚',
            description: '용어집 페이지 방문',
            category: 'beginner',
            points: 10
        },
        guide_reader: {
            id: 'guide_reader',
            name: '가이드 독파',
            icon: '📖',
            description: '가이드 페이지 완독',
            category: 'beginner',
            points: 25
        },

        // 📊 분석가 배지
        portfolio_viewer: {
            id: 'portfolio_viewer',
            name: '포트폴리오 분석가',
            icon: '📊',
            description: '포트폴리오 대시보드 확인',
            category: 'analyst',
            points: 10
        },
        screener_user: {
            id: 'screener_user',
            name: '가치 탐정',
            icon: '🔍',
            description: '스크리너로 종목 분석',
            category: 'analyst',
            points: 20
        },
        sector_analyst: {
            id: 'sector_analyst',
            name: '섹터 전문가',
            icon: '🎯',
            description: '섹터 분석 차트 확인',
            category: 'analyst',
            points: 15
        },

        // 🎮 게이미피케이션 배지
        ai_challenger: {
            id: 'ai_challenger',
            name: 'AI 도전자',
            icon: '🤖',
            description: 'AI 대결 페이지 방문',
            category: 'game',
            points: 15
        },
        idea_creator: {
            id: 'idea_creator',
            name: '아이디어 창출자',
            icon: '💡',
            description: '첫 투자 아이디어 등록',
            category: 'game',
            points: 25
        },
        prediction_master: {
            id: 'prediction_master',
            name: '예측의 달인',
            icon: '🎯',
            description: '아이디어 예측 3회 적중',
            category: 'game',
            points: 50
        },

        // 🏆 퀴즈 마스터 배지
        quiz_perfect: {
            id: 'quiz_perfect',
            name: '만점 왕',
            icon: '💯',
            description: '퀴즈 만점 달성',
            category: 'quiz',
            points: 50
        },
        quiz_master: {
            id: 'quiz_master',
            name: '퀴즈 마스터',
            icon: '🏆',
            description: '모든 카테고리 퀴즈 완료',
            category: 'quiz',
            points: 100
        },
        quiz_streak: {
            id: 'quiz_streak',
            name: '연속 정답',
            icon: '🔥',
            description: '5문제 연속 정답',
            category: 'quiz',
            points: 30
        },

        // 💎 가치투자 배지
        graham_disciple: {
            id: 'graham_disciple',
            name: '그레이엄의 제자',
            icon: '📕',
            description: '안전마진 개념 학습 완료',
            category: 'value',
            points: 30
        },
        buffett_follower: {
            id: 'buffett_follower',
            name: '버핏 추종자',
            icon: '🎩',
            description: '경제적 해자 개념 학습 완료',
            category: 'value',
            points: 30
        },
        lynch_learner: {
            id: 'lynch_learner',
            name: '린치 학습자',
            icon: '📈',
            description: 'PEG 비율 이해 완료',
            category: 'value',
            points: 30
        },

        // ⭐ 특별 배지
        night_owl: {
            id: 'night_owl',
            name: '밤의 투자자',
            icon: '🦉',
            description: '자정 이후 접속',
            category: 'special',
            points: 15
        },
        early_bird: {
            id: 'early_bird',
            name: '얼리버드',
            icon: '🐦',
            description: '오전 6시 이전 접속',
            category: 'special',
            points: 15
        },
        weekend_warrior: {
            id: 'weekend_warrior',
            name: '주말 전사',
            icon: '⚔️',
            description: '주말에 학습',
            category: 'special',
            points: 20
        },
        dedicated_learner: {
            id: 'dedicated_learner',
            name: '열정 학습자',
            icon: '🌟',
            description: '7일 연속 접속',
            category: 'special',
            points: 100
        },
        calculator_user: {
            id: 'calculator_user',
            name: '가치 계산사',
            icon: '🧮',
            description: '내재가치 계산기 사용',
            category: 'analyst',
            points: 25
        },
        first_analysis: {
            id: 'first_analysis',
            name: '첫 분석 저장',
            icon: '💾',
            description: '첫 번째 종목 분석을 저장함',
            category: 'analyst',
            points: 30
        },
        analyst_junior: {
            id: 'analyst_junior',
            name: '주니어 애널리스트',
            icon: '📊',
            description: '5개 이상 종목 분석 저장',
            category: 'analyst',
            points: 50
        },
        curriculum_starter: {
            id: 'curriculum_starter',
            name: '학습 시작',
            icon: '🎯',
            description: '커리큘럼 첫 학습 완료',
            category: 'beginner',
            points: 15
        },
        curriculum_week1: {
            id: 'curriculum_week1',
            name: '1주차 완료',
            icon: '1️⃣',
            description: '1주차 커리큘럼 완료',
            category: 'value',
            points: 50
        },
        curriculum_master: {
            id: 'curriculum_master',
            name: '커리큘럼 마스터',
            icon: '🎓',
            description: '전체 커리큘럼 완료',
            category: 'special',
            points: 200
        },
        social_sharer: {
            id: 'social_sharer',
            name: '공유왕',
            icon: '📢',
            description: '배지를 소셜 미디어에 공유',
            category: 'special',
            points: 30
        }
    },

    // 카테고리 정보
    categories: {
        beginner: { name: '입문', icon: '🌱', color: '#4ade80' },
        analyst: { name: '분석', icon: '📊', color: '#60a5fa' },
        game: { name: '게임', icon: '🎮', color: '#f472b6' },
        quiz: { name: '퀴즈', icon: '🧠', color: '#facc15' },
        value: { name: '가치투자', icon: '💎', color: '#a78bfa' },
        special: { name: '특별', icon: '⭐', color: '#fb923c' }
    },

    // 저장소 키
    STORAGE_KEY: 'spg_badges',
    STATS_KEY: 'spg_badge_stats',

    // 버전 체크 및 마이그레이션
    checkVersion() {
        try {
            const savedVersion = localStorage.getItem(this.VERSION_KEY);
            if (savedVersion !== this.VERSION) {
                this.migrateData(savedVersion);
                localStorage.setItem(this.VERSION_KEY, this.VERSION);
            }
        } catch (e) {
            console.warn('Version check failed:', e);
        }
    },

    // 데이터 마이그레이션
    migrateData(fromVersion) {
        console.log(`Migrating badge data from ${fromVersion || 'v1'} to ${this.VERSION}`);
        // 필요시 마이그레이션 로직 추가
    },

    // 획득한 배지 가져오기 (try-catch 추가)
    getEarnedBadges() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (!saved) return {};
            const parsed = JSON.parse(saved);
            return typeof parsed === 'object' && parsed !== null ? parsed : {};
        } catch (e) {
            console.warn('Failed to load badges:', e);
            return {};
        }
    },

    // 배지 저장 (try-catch 추가)
    saveEarnedBadges(badges) {
        try {
            if (typeof badges !== 'object' || badges === null) {
                throw new Error('Invalid badge data');
            }
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(badges));
            return true;
        } catch (e) {
            console.error('Failed to save badges:', e);
            return false;
        }
    },

    // 통계 가져오기 (try-catch 추가)
    getStats() {
        try {
            const saved = localStorage.getItem(this.STATS_KEY);
            if (!saved) {
                return this.getDefaultStats();
            }
            const parsed = JSON.parse(saved);
            return { ...this.getDefaultStats(), ...parsed };
        } catch (e) {
            console.warn('Failed to load stats:', e);
            return this.getDefaultStats();
        }
    },

    // 기본 통계
    getDefaultStats() {
        return {
            totalPoints: 0,
            badgeCount: 0,
            loginDays: [],
            quizScores: [],
            lastLogin: null,
            version: this.VERSION
        };
    },

    // 통계 저장 (try-catch 추가)
    saveStats(stats) {
        try {
            if (typeof stats !== 'object' || stats === null) {
                throw new Error('Invalid stats data');
            }
            localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
            return true;
        } catch (e) {
            console.error('Failed to save stats:', e);
            return false;
        }
    },

    // 배지 획득
    earnBadge(badgeId) {
        const badge = this.badges[badgeId];
        if (!badge) return null;

        const earned = this.getEarnedBadges();
        if (earned[badgeId]) return null; // 이미 획득

        earned[badgeId] = {
            earnedAt: new Date().toISOString(),
            points: badge.points
        };
        this.saveEarnedBadges(earned);

        // 통계 업데이트
        const stats = this.getStats();
        stats.totalPoints += badge.points;
        stats.badgeCount++;
        this.saveStats(stats);

        // 알림 표시
        this.showBadgeNotification(badge);

        return badge;
    },

    // 배지 획득 알림
    showBadgeNotification(badge) {
        // 기존 알림 제거
        const existing = document.querySelector('.badge-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = 'badge-notification';
        notification.innerHTML = `
            <div class="badge-notification-content">
                <div class="badge-notification-icon">${badge.icon}</div>
                <div class="badge-notification-text">
                    <div class="badge-notification-title">🎉 배지 획득!</div>
                    <div class="badge-notification-name">${badge.name}</div>
                    <div class="badge-notification-desc">${badge.description}</div>
                    <div class="badge-notification-points">+${badge.points} 포인트</div>
                </div>
            </div>
        `;
        document.body.appendChild(notification);

        // 애니메이션
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    },

    // 배지 보유 여부 확인
    hasBadge(badgeId) {
        const earned = this.getEarnedBadges();
        return !!earned[badgeId];
    },

    // 총 포인트
    getTotalPoints() {
        const stats = this.getStats();
        return stats.totalPoints;
    },

    // 획득 배지 수
    getBadgeCount() {
        return Object.keys(this.getEarnedBadges()).length;
    },

    // 전체 배지 수
    getTotalBadgeCount() {
        return Object.keys(this.badges).length;
    },

    // 레벨 계산
    getLevel() {
        const points = this.getTotalPoints();
        if (points >= 500) return { level: 5, name: '투자 마스터', icon: '👑', nextAt: null };
        if (points >= 300) return { level: 4, name: '숙련 투자자', icon: '💎', nextAt: 500 };
        if (points >= 150) return { level: 3, name: '중급 투자자', icon: '🥈', nextAt: 300 };
        if (points >= 50) return { level: 2, name: '초보 투자자', icon: '🥉', nextAt: 150 };
        return { level: 1, name: '입문자', icon: '🌱', nextAt: 50 };
    },

    // 시간대 배지 체크
    checkTimeBadges() {
        const hour = new Date().getHours();
        const day = new Date().getDay();

        if (hour >= 0 && hour < 5) {
            this.earnBadge('night_owl');
        }
        if (hour >= 5 && hour < 7) {
            this.earnBadge('early_bird');
        }
        if (day === 0 || day === 6) {
            this.earnBadge('weekend_warrior');
        }
    },

    // 연속 접속 체크
    checkLoginStreak() {
        const stats = this.getStats();
        const today = new Date().toDateString();

        if (!stats.loginDays.includes(today)) {
            stats.loginDays.push(today);
            stats.lastLogin = today;

            // 최근 7일만 유지
            if (stats.loginDays.length > 30) {
                stats.loginDays = stats.loginDays.slice(-30);
            }

            this.saveStats(stats);

            // 7일 연속 체크
            const last7Days = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                last7Days.push(d.toDateString());
            }

            if (last7Days.every(day => stats.loginDays.includes(day))) {
                this.earnBadge('dedicated_learner');
            }
        }
    },

    // 배지 목록 HTML 생성
    renderBadgeList(container, filter = 'all') {
        const earned = this.getEarnedBadges();
        const categories = filter === 'all'
            ? Object.keys(this.categories)
            : [filter];

        let html = '<div class="badge-grid">';

        categories.forEach(cat => {
            const catBadges = Object.values(this.badges).filter(b => b.category === cat);
            catBadges.forEach(badge => {
                const isEarned = !!earned[badge.id];
                html += `
                    <div class="badge-item ${isEarned ? 'earned' : 'locked'}" title="${badge.description}">
                        <div class="badge-icon">${isEarned ? badge.icon : '🔒'}</div>
                        <div class="badge-name">${badge.name}</div>
                        <div class="badge-points">${badge.points}pt</div>
                    </div>
                `;
            });
        });

        html += '</div>';
        container.innerHTML = html;
    },

    // 프로필 위젯 HTML 생성
    renderProfileWidget() {
        const level = this.getLevel();
        const points = this.getTotalPoints();
        const badgeCount = this.getBadgeCount();
        const totalBadges = this.getTotalBadgeCount();
        const progress = level.nextAt ? ((points / level.nextAt) * 100).toFixed(0) : 100;

        return `
            <div class="badge-profile-widget">
                <div class="profile-level">
                    <span class="level-icon">${level.icon}</span>
                    <span class="level-name">${level.name}</span>
                </div>
                <div class="profile-stats">
                    <div class="stat">
                        <span class="stat-value">${points}</span>
                        <span class="stat-label">포인트</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${badgeCount}/${totalBadges}</span>
                        <span class="stat-label">배지</span>
                    </div>
                </div>
                ${level.nextAt ? `
                    <div class="level-progress">
                        <div class="progress-bar" style="width: ${progress}%"></div>
                    </div>
                    <div class="level-next">다음 레벨까지 ${level.nextAt - points}pt</div>
                ` : '<div class="level-max">🎉 최고 레벨 달성!</div>'}
            </div>
        `;
    },

    // 초기화
    init() {
        this.checkVersion();
        this.checkTimeBadges();
        this.checkLoginStreak();
        this.earnBadge('first_login');
        this.injectStyles();
    },

    // 배지 공유하기 (소셜)
    shareBadge(badgeId, platform = 'twitter') {
        const badge = this.badges[badgeId];
        if (!badge) return;

        const text = `🏆 "${badge.name}" 배지를 획득했습니다! ${badge.icon}\n${badge.description}\n\n#주식투자 #가치투자 #포트폴리오지니어스`;
        const url = window.location.origin + '/badges.html';

        let shareUrl = '';
        switch(platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
                break;
            case 'kakao':
                // 카카오톡은 SDK 필요, 대신 클립보드 복사
                this.copyToClipboard(text + '\n' + url);
                alert('내용이 클립보드에 복사되었습니다. 카카오톡에 붙여넣기 하세요!');
                this.earnBadge('social_sharer');
                return;
        }

        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
            this.earnBadge('social_sharer');
        }
    },

    // 클립보드 복사
    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
    },

    // 리더보드 데이터 생성 (로컬 시뮬레이션)
    getLeaderboard() {
        const myStats = this.getStats();
        const myLevel = this.getLevel();

        // 시뮬레이션된 리더보드 (실제 서버 연동 시 API 호출로 대체)
        const leaderboard = [
            { rank: 1, name: '투자의신', level: '투자 마스터', points: 850, icon: '👑' },
            { rank: 2, name: '가치투자왕', level: '고급 투자자', points: 620, icon: '💎' },
            { rank: 3, name: '워렌버핏Jr', level: '고급 투자자', points: 480, icon: '🥈' },
            { rank: 4, name: '분석맨', level: '중급 투자자', points: 320, icon: '📊' },
            { rank: 5, name: '주린이', level: '중급 투자자', points: 280, icon: '📈' }
        ];

        // 내 순위 계산
        const myRank = leaderboard.filter(u => u.points > myStats.totalPoints).length + 1;

        return {
            leaderboard,
            myRank,
            myPoints: myStats.totalPoints,
            myLevel: myLevel.name
        };
    },

    // CSS 스타일 주입
    injectStyles() {
        if (document.getElementById('badge-styles')) return;

        const style = document.createElement('style');
        style.id = 'badge-styles';
        style.textContent = `
            .badge-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10001;
                opacity: 0;
                transform: translateX(100px);
                transition: all 0.3s ease;
            }
            .badge-notification.show {
                opacity: 1;
                transform: translateX(0);
            }
            .badge-notification-content {
                background: linear-gradient(135deg, #1e1e3f 0%, #2d2d5a 100%);
                border: 2px solid #4ade80;
                border-radius: 16px;
                padding: 20px;
                display: flex;
                gap: 15px;
                align-items: center;
                box-shadow: 0 10px 40px rgba(74, 222, 128, 0.3);
                min-width: 280px;
            }
            .badge-notification-icon {
                font-size: 3rem;
                animation: bounce 0.5s ease;
            }
            @keyframes bounce {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.2); }
            }
            .badge-notification-title {
                color: #4ade80;
                font-weight: bold;
                font-size: 0.9rem;
            }
            .badge-notification-name {
                font-size: 1.2rem;
                font-weight: bold;
                color: #fff;
            }
            .badge-notification-desc {
                font-size: 0.85rem;
                color: rgba(255,255,255,0.7);
            }
            .badge-notification-points {
                color: #facc15;
                font-weight: bold;
                margin-top: 5px;
            }

            .badge-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                gap: 15px;
            }
            .badge-item {
                background: rgba(255,255,255,0.05);
                border-radius: 12px;
                padding: 15px;
                text-align: center;
                transition: all 0.2s;
            }
            .badge-item.earned {
                border: 2px solid #4ade80;
            }
            .badge-item.locked {
                opacity: 0.5;
                filter: grayscale(1);
            }
            .badge-item:hover {
                transform: translateY(-3px);
            }
            .badge-icon {
                font-size: 2rem;
                margin-bottom: 8px;
            }
            .badge-name {
                font-size: 0.8rem;
                font-weight: bold;
                margin-bottom: 4px;
            }
            .badge-points {
                font-size: 0.7rem;
                color: #facc15;
            }

            .badge-profile-widget {
                background: rgba(255,255,255,0.05);
                border-radius: 12px;
                padding: 15px;
                text-align: center;
            }
            .profile-level {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                margin-bottom: 12px;
            }
            .level-icon {
                font-size: 1.5rem;
            }
            .level-name {
                font-weight: bold;
                font-size: 1.1rem;
            }
            .profile-stats {
                display: flex;
                justify-content: center;
                gap: 30px;
                margin-bottom: 12px;
            }
            .stat {
                text-align: center;
            }
            .stat-value {
                display: block;
                font-size: 1.3rem;
                font-weight: bold;
                color: #4ade80;
            }
            .stat-label {
                font-size: 0.75rem;
                color: rgba(255,255,255,0.6);
            }
            .level-progress {
                height: 6px;
                background: rgba(255,255,255,0.1);
                border-radius: 3px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #4ade80, #22c55e);
                border-radius: 3px;
                transition: width 0.5s ease;
            }
            .level-next, .level-max {
                font-size: 0.8rem;
                color: rgba(255,255,255,0.6);
            }
            .level-max {
                color: #facc15;
            }

            :root[data-theme="light"] .badge-notification-content {
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            }
            :root[data-theme="light"] .badge-notification-name {
                color: #1a1a2e;
            }
            :root[data-theme="light"] .badge-item {
                background: rgba(0,0,0,0.05);
            }
            :root[data-theme="light"] .badge-profile-widget {
                background: rgba(0,0,0,0.05);
            }
        `;
        document.head.appendChild(style);
    }
};

// 전역 접근 가능하게
window.BadgeSystem = BadgeSystem;
