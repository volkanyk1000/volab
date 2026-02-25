/**
 * VOLAB PREMIUM - ULTIMATE ADMIN MODULE (FULL VERSION)
 * INTEGRATION: FCM v1 (Yeni Nesil) Push Bildirim motoru tüm fonksiyonlar korunarak eklendi.
 * PRESERVED: API Matcher, UEFA Tournament Logic, Live Score Sync, Global Team Selectors.
 */

window.AdminModule = {
    matches: [],
    usersList: [],
    feedbacks: [],
    apiMatches: [],
    
    selectedHome: null,
    selectedAway: null,
    selectedApiMatchId: null,
    currentTarget: null,
    selectedUefaHome: null,
    selectedUefaAway: null,
    allGlobalTeams: [],

    // FCM v1 Yetkilendirme Değişkenleri
    fcmServiceAccount: null,
    fcmAccessToken: null,

    // --- GENEL SİSTEM ---
    showSystemMsg: function(msg) {
        var box = document.getElementById('errorBox');
        var msgEl = document.getElementById('errorMessage');
        if (box && msgEl) {
            msgEl.innerText = msg;
            box.classList.remove('hidden');
            setTimeout(function() { box.classList.add('hidden'); }, 3000);
        }
    },

    logout: function() {
        localStorage.removeItem('voUser');
        window.location.href = "index.html";
    },

    switchTab: function(tab) {
        var sections = {'add': 'adminSectionAdd', 'active': 'adminSectionActive', 'uefa': 'adminSectionUefa', 'notify': 'adminSectionNotify', 'feedback': 'adminSectionFeedback', 'users': 'adminSectionUsers'};
        var btns = {'add': 'btn_tab_add', 'active': 'btn_tab_active', 'uefa': 'btn_tab_uefa', 'notify': 'btn_tab_notify', 'feedback': 'btn_tab_feedback', 'users': 'btn_tab_users'}
        
        Object.keys(sections).forEach(function(k) {
            var secEl = document.getElementById(sections[k]);
            var btnEl = document.getElementById(btns[k]);
            if (secEl) {
                if (k === tab) secEl.classList.remove('hidden');
                else secEl.classList.add('hidden');
            }
            if (btnEl) {
                var isSpecial = (k === 'uefa' || k === 'notify') ? ' flex items-center gap-1' : '';
                btnEl.className = (k === tab) 
                    ? "whitespace-nowrap px-6 py-4 bg-cyan-600 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white shadow-lg transition-all cursor-pointer" + isSpecial
                    : "whitespace-nowrap px-6 py-4 bg-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 transition-all cursor-pointer" + isSpecial;
            }
        });
    },

    getLogoPath: function(lig, t) {
        var folder = (window.LEAGUE_CONFIG && window.LEAGUE_CONFIG[lig]) ? window.LEAGUE_CONFIG[lig] : "turkiye";
        return "logos/" + folder + "/" + t + ".png"; 
    },

    // --- CUSTOM LİG SEÇİCİ (DROPDOWN) ---
    toggleLeagueDropdown: function(forceClose = false) {
        var body = document.getElementById('leagueDropdownBody');
        var icon = document.getElementById('leagueSelectIcon');
        if (!body || !icon) return;
        
        if (forceClose || !body.classList.contains('hidden')) {
            body.classList.add('hidden');
            icon.style.transform = 'rotate(0deg)';
        } else {
            body.classList.remove('hidden');
            icon.style.transform = 'rotate(180deg)';
        }
    },

    selectLeague: function(leagueKey) {
        var folder = window.LEAGUE_CONFIG[leagueKey];
        var logoPath = "logos/leagues/" + folder + ".png"; 
        var lInfo = window.getLeagueInfo ? window.getLeagueInfo(leagueKey) : { name: leagueKey };
        
        document.getElementById('matchLeague').value = leagueKey;
        document.getElementById('leagueSelectText').innerHTML = `
            <img src="${logoPath}" class="w-6 h-6 object-contain drop-shadow-md" onerror="this.src='logos/default.png'">
            <span class="text-white text-[11px] font-black uppercase tracking-widest">${lInfo.name}</span>
        `;
        
        this.toggleLeagueDropdown(true);

        this.selectedHome = null; 
        this.selectedAway = null;
        document.getElementById('homeTeamText').innerText = 'EV SAHİBİ'; 
        document.getElementById('awayTeamText').innerText = 'DEPLASMAN';
        document.getElementById('homeTeamPreview').classList.add('hidden'); 
        document.getElementById('awayTeamPreview').classList.add('hidden');
    },

    renderLeagueDropdown: function() {
        var body = document.getElementById('leagueDropdownBody');
        if (!body || !window.LEAGUE_CONFIG) return;
        
        body.innerHTML = '';
        var self = this;
        
        Object.keys(window.LEAGUE_CONFIG).sort().forEach(function(lKey) {
            var folder = window.LEAGUE_CONFIG[lKey];
            var logoPath = "logos/leagues/" + folder + ".png";
            var lInfo = window.getLeagueInfo ? window.getLeagueInfo(lKey) : { name: lKey };
            
            var item = document.createElement('div');
            item.className = "flex items-center gap-3 p-3 hover:bg-cyan-900/40 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-cyan-500/30";
            item.innerHTML = `
                <img src="${logoPath}" class="w-7 h-7 object-contain drop-shadow-md" onerror="this.src='logos/default.png'">
                <span class="text-[10px] font-black text-slate-300 uppercase tracking-widest">${lInfo.name}</span>
            `;
            item.onclick = function() { self.selectLeague(lKey); };
            body.appendChild(item);
        });
        
        document.addEventListener('click', function(e) {
            var wrapper = document.getElementById('customLeagueDropdownWrapper');
            if (wrapper && !wrapper.contains(e.target)) {
                self.toggleLeagueDropdown(true);
            }
        });
    },

    openTeamSelector: function(side) {
        var lSelect = document.getElementById('matchLeague');
        if (!lSelect || !lSelect.value) return this.showSystemMsg("ÖNCE LİG SEÇİN!");
        
        this.currentTarget = side;
        var folder = window.LEAGUE_CONFIG[lSelect.value];
        var teams = window.LEAGUE_TEAMS[folder] || [];
        var grid = document.getElementById('teamGrid'); 
        grid.innerHTML = ''; 
        var self = this;
        
        teams.forEach(function(t) {
            var card = document.createElement('div');
            card.className = "flex flex-col items-center p-4 bg-white/5 rounded-3xl cursor-pointer border border-white/5 hover:border-cyan-500/50 transition-all";
            card.innerHTML = `<img src="${self.getLogoPath(lSelect.value, t)}" class="w-10 h-10 object-contain mb-2" onerror="this.src='logos/default.png'"><span class="text-[8px] font-black uppercase text-center">${t}</span>`;
            card.onclick = function() {
                if (side === 'home') { 
                    self.selectedHome = t; 
                    document.getElementById('homeTeamText').innerText = t; 
                    document.getElementById('homeTeamPreview').src = self.getLogoPath(lSelect.value, t); 
                    document.getElementById('homeTeamPreview').classList.remove('hidden'); 
                } else { 
                    self.selectedAway = t; 
                    document.getElementById('awayTeamText').innerText = t; 
                    document.getElementById('awayTeamPreview').src = self.getLogoPath(lSelect.value, t); 
                    document.getElementById('awayTeamPreview').classList.remove('hidden'); 
                }
                document.getElementById('teamSelectorModal').classList.add('hidden');
            };
            grid.appendChild(card);
        });
        document.getElementById('teamSelectorModal').classList.remove('hidden');
        document.getElementById('teamSelectorModal').style.display = 'flex';
    },

    closeTeamSelector: function() { 
        document.getElementById('teamSelectorModal').classList.add('hidden'); 
    },

    openGlobalTeamSelector: function(side) {
        this.currentTarget = side;
        var modal = document.getElementById('globalTeamSelectorModal');
        var grid = document.getElementById('globalTeamGrid');
        if (!modal || !grid) return;
        
        this.allGlobalTeams = [];
        Object.keys(window.LEAGUE_CONFIG).forEach(l => {
            var f = window.LEAGUE_CONFIG[l];
            (window.LEAGUE_TEAMS[f] || []).forEach(t => {
                this.allGlobalTeams.push({ name: t, league: l, logo: "logos/" + f + "/" + t + ".png" });
            });
        });
        
        grid.innerHTML = `
            <div class="col-span-full mb-4 sticky top-0 z-10 bg-[#0f172a] pb-2">
                <input type="text" id="uefaSearch" placeholder="TAKIM ARA..." 
                    class="w-full bg-slate-800 border border-white/10 rounded-2xl p-4 text-[11px] font-black text-white outline-none focus:border-cyan-500 transition-all" 
                    oninput="window.AdminModule.filterGlobalTeams(this.value)">
            </div>
            <div id="uefaResultsWrapper" class="col-span-full grid grid-cols-3 gap-2 pb-4 max-h-[60vh] overflow-y-auto"></div>
        `;
        
        this.renderGlobalTeams(this.allGlobalTeams);
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    },

    renderGlobalTeams: function(teams) {
        var resultsGrid = document.getElementById('uefaResultsWrapper');
        if (!resultsGrid) return;
        resultsGrid.innerHTML = '';
        var self = this;
        
        teams.forEach(t => {
            var div = document.createElement('div');
            div.className = "flex flex-col items-center p-3 bg-white/5 rounded-2xl cursor-pointer border border-white/5 hover:border-cyan-500/50 transition-all";
            div.innerHTML = `<img src="${t.logo}" class="w-8 h-8 object-contain mb-2" onerror="this.src='logos/default.png'"><span class="text-[7px] font-black uppercase text-white text-center">${t.name}</span>`;
            div.onclick = () => {
                if (self.currentTarget === 'home') { 
                    self.selectedUefaHome = t; 
                    document.getElementById('uefaHomeText').innerText = t.name; 
                    document.getElementById('uefaHomePreview').src = t.logo; 
                    document.getElementById('uefaHomePreview').classList.remove('hidden'); 
                } else { 
                    self.selectedUefaAway = t; 
                    document.getElementById('uefaAwayText').innerText = t.name; 
                    document.getElementById('uefaAwayPreview').src = t.logo; 
                    document.getElementById('uefaAwayPreview').classList.remove('hidden'); 
                }
                document.getElementById('globalTeamSelectorModal').classList.add('hidden');
            };
            resultsGrid.appendChild(div);
        });
    },

    filterGlobalTeams: function(query) {
        var q = query ? query.toLowerCase() : '';
        var filtered = this.allGlobalTeams.filter(t => t.name.toLowerCase().includes(q));
        this.renderGlobalTeams(filtered);
    },

    closeGlobalTeamSelector: function() { 
        document.getElementById('globalTeamSelectorModal').classList.add('hidden'); 
    },

    addNewMatch: function() {
        var l = document.getElementById('matchLeague').value;
        var p = document.getElementById('prediction').value;
        var c = document.getElementById('confidence').value;
        var cat = document.getElementById('matchCategory').value;
        
        var vipBox = document.getElementById('isVip');
        var isPro = vipBox ? vipBox.checked : false;
        
        if (!this.selectedHome || !this.selectedAway || !p || l === "") return this.showSystemMsg("EKSİK ALANLAR!");
        
        window.db.collection("matches").add({
            league: l, homeTeam: this.selectedHome, awayTeam: this.selectedAway, prediction: p, status: 'waiting', 
            vip: isPro, isVip: isPro,
            confidence: c, category: cat, apiMatchId: this.selectedApiMatchId || null, homeScore: 0, awayScore: 0, 
            matchMinute: "0'", createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => { this.showSystemMsg("YAYINLANDI!"); this.resetForm(); });
    },

    addUefaMatch: function() {
        var t = document.getElementById('uefaTournament').value;
        var p = document.getElementById('uefaPrediction').value;
        var c = document.getElementById('uefaConfidence').value;
        
        var uefaVipBox = document.getElementById('uefaIsVip');
        var isPro = uefaVipBox ? uefaVipBox.checked : false;
        
        if (!this.selectedUefaHome || !this.selectedUefaAway || !p) return this.showSystemMsg("EKSİK ALANLAR!");
        
        window.db.collection("matches").add({
            league: t, homeTeam: this.selectedUefaHome.name, awayTeam: this.selectedUefaAway.name,
            homeLogo: this.selectedUefaHome.logo, awayLogo: this.selectedUefaAway.logo,
            prediction: p, status: 'waiting', 
            vip: isPro, isVip: isPro,
            confidence: c, category: t, type: 'uefa',
            homeScore: 0, awayScore: 0, matchMinute: "0'", createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => { this.showSystemMsg("UEFA YAYINLANDI!"); this.resetFormUefa(); });
    },

    resetForm: function() {
        document.getElementById('prediction').value = '';
        this.selectedHome = null; this.selectedAway = null; this.selectedApiMatchId = null;
        document.getElementById('homeTeamText').innerText = 'EV SAHİBİ'; 
        document.getElementById('awayTeamText').innerText = 'DEPLASMAN';
        document.getElementById('homeTeamPreview').classList.add('hidden'); 
        document.getElementById('awayTeamPreview').classList.add('hidden');
        if(document.getElementById('isVip')) document.getElementById('isVip').checked = false;
        if(document.getElementById('apiMatchText')) document.getElementById('apiMatchText').innerText = 'API İLE EŞLEŞTİR (OTOMATİK)';
        
        document.getElementById('matchLeague').value = "";
        document.getElementById('leagueSelectText').innerHTML = 'LİG SEÇİN...';
    },

    resetFormUefa: function() {
        this.selectedUefaHome = null; this.selectedUefaAway = null;
        document.getElementById('uefaHomeText').innerText = 'EV SAHİBİ';
        document.getElementById('uefaAwayText').innerText = 'DEPLASMAN';
        document.getElementById('uefaHomePreview').classList.add('hidden');
        document.getElementById('uefaAwayPreview').classList.add('hidden');
        document.getElementById('uefaPrediction').value = '';
        if(document.getElementById('uefaIsVip')) document.getElementById('uefaIsVip').checked = false;
    },

    // --- MAÇ LİSTELEME ---
    renderMatches: function() {
        var adminL = document.getElementById('adminMatchesList');
        var uefaL = document.getElementById('adminUefaMatchesList');
        if (adminL) adminL.innerHTML = '';
        if (uefaL) uefaL.innerHTML = '';
        
        this.matches.forEach(m => {
            var isUefa = (m.type === 'uefa' || ['UCL', 'UEL', 'UECL'].includes(m.category) || ['UCL', 'UEL', 'UECL'].includes(m.league));
            var card = document.createElement('div');
            
            var hLogo = isUefa ? (m.homeLogo || "logos/default.png") : this.getLogoPath(m.league, m.homeTeam);
            var aLogo = isUefa ? (m.awayLogo || "logos/default.png") : this.getLogoPath(m.league, m.awayTeam);
            
            var hs = m.homeScore !== undefined ? m.homeScore : 0;
            var as = m.awayScore !== undefined ? m.awayScore : 0;
            var mm = m.matchMinute || "0'";

            var scoreUI = (m.apiMatchId) 
                ? `<div class="text-center px-4"><span class="text-2xl font-black italic text-white tracking-tighter">${hs}:${as}</span><p class="text-[9px] font-black text-red-500 animate-pulse">${mm}</p></div>`
                : `<div class="text-center px-4 opacity-30"><span class="text-xl font-black italic text-slate-500 uppercase tracking-widest">VS</span></div>`;

            var statusBadge = '';
            if (m.status === 'waiting') {
                statusBadge = '<span class="px-2 py-1 bg-orange-500/10 text-orange-400 rounded-lg text-[8px] font-black uppercase tracking-widest border border-orange-500/20">BEKLEMEDE</span>';
            } else if (m.status === 'won') {
                statusBadge = '<span class="px-2 py-1 bg-green-500/10 text-green-400 rounded-lg text-[8px] font-black uppercase tracking-widest border border-green-500/20">KAZANDI</span>';
            } else if (m.status === 'lost') {
                statusBadge = '<span class="px-2 py-1 bg-red-500/10 text-red-400 rounded-lg text-[8px] font-black uppercase tracking-widest border border-red-500/20">KAYBETTİ</span>';
            }
            
            var isProBadge = (m.vip || m.isVip) ? '<span class="ml-2 px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-[8px] font-black uppercase tracking-widest">PRO</span>' : '';

            var lFolder = (window.LEAGUE_CONFIG && window.LEAGUE_CONFIG[m.league]) ? window.LEAGUE_CONFIG[m.league] : "turkiye";
            var leagueLogoUrl = "logos/leagues/" + lFolder + ".png";
            var lInfo = (window.getLeagueInfo) ? window.getLeagueInfo(m.league) : { name: m.league };

            if (isUefa) {
                let themeBorder = "border-white/10";
                let themeBg = "bg-slate-900/80";
                let themeText = "text-white";
                let themeGlow = "";
                let themeIcon = "trophy";
                
                var catCheck = (m.category || m.league || "").toUpperCase();

                if (catCheck === 'UCL') { 
                    themeBorder = "border-blue-500/40"; themeBg = "bg-gradient-to-br from-blue-950/80 to-[#07070a]"; themeText = "text-blue-400"; themeGlow = "shadow-[0_0_20px_rgba(59,130,246,0.15)]";
                } else if (catCheck === 'UEL') { 
                    themeBorder = "border-orange-500/40"; themeBg = "bg-gradient-to-br from-orange-950/80 to-[#07070a]"; themeText = "text-orange-400"; themeGlow = "shadow-[0_0_20px_rgba(249,115,22,0.15)]";
                } else if (catCheck === 'UECL') { 
                    themeBorder = "border-emerald-500/40"; themeBg = "bg-gradient-to-br from-emerald-950/80 to-[#07070a]"; themeText = "text-emerald-400"; themeGlow = "shadow-[0_0_20px_rgba(16,185,129,0.15)]";
                }

                card.className = `${themeBg} p-6 rounded-[2.5rem] border ${themeBorder} ${themeGlow} mb-6 relative overflow-hidden transition-all duration-300`;

                card.innerHTML = `
                    <div class="flex justify-between items-center mb-6">
                        <div class="flex items-center">
                            <span class="text-[10px] font-black ${themeText} uppercase tracking-widest flex items-center gap-1"><i data-lucide="${themeIcon}" class="w-3 h-3"></i>${catCheck}</span>
                            ${isProBadge}
                        </div>
                        <div class="flex items-center gap-2">
                            ${statusBadge}
                            <button onclick="window.db.collection('matches').doc('${m.id}').delete()" class="text-red-500 text-[8px] font-black bg-red-500/10 px-2 py-1 rounded-lg hover:bg-red-500/20 transition-all">SİL</button>
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center mb-6 px-2">
                        <div class="flex flex-col items-center w-28">
                            <img src="${hLogo}" class="w-14 h-14 object-contain mb-3 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" onerror="this.src='logos/default.png'">
                            <span class="text-[8px] font-black text-center text-slate-200 truncate w-full uppercase tracking-tighter">${m.homeTeam}</span>
                        </div>
                        ${scoreUI}
                        <div class="flex flex-col items-center w-28">
                            <img src="${aLogo}" class="w-14 h-14 object-contain mb-3 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" onerror="this.src='logos/default.png'">
                            <span class="text-[8px] font-black text-center text-slate-200 truncate w-full uppercase tracking-tighter">${m.awayTeam}</span>
                        </div>
                    </div>
                    
                    <div class="bg-black/50 rounded-2xl p-4 text-center border border-white/5 shadow-inner">
                        <p class="text-[11px] font-black ${themeText} uppercase tracking-widest">${m.prediction}</p>
                    </div>
                    
                    <div class="flex gap-2 mt-4 pt-4 border-t border-white/5">
                        <button onclick="window.db.collection('matches').doc('${m.id}').update({status:'won'})" class="flex-1 py-3 bg-green-600/10 hover:bg-green-600/20 text-green-500 border border-green-500/20 rounded-xl text-[7px] font-black uppercase transition-all">KAZANDI YAP</button>
                        <button onclick="window.db.collection('matches').doc('${m.id}').update({status:'lost'})" class="flex-1 py-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 rounded-xl text-[7px] font-black uppercase transition-all">KAYBETTİ YAP</button>
                        <button onclick="window.db.collection('matches').doc('${m.id}').update({status:'waiting'})" class="flex-1 py-3 bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 border border-orange-500/20 rounded-xl text-[7px] font-black uppercase transition-all">BEKLEMEDE YAP</button>
                    </div>
                `;
                if (uefaL) uefaL.appendChild(card);
            } 
            else {
                card.className = "bg-slate-900/80 p-6 rounded-[2.5rem] border border-white/5 mb-6 relative overflow-hidden";
                card.innerHTML = `
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex items-center">
                            <span class="text-[8px] font-black text-slate-500 uppercase">${m.category || 'ANALİZ'}</span>
                            ${isProBadge}
                        </div>
                        <div class="flex items-center gap-2">
                            ${statusBadge}
                            <button onclick="window.db.collection('matches').doc('${m.id}').delete()" class="text-red-500 text-[8px] font-black bg-red-500/10 px-2 py-1 rounded-lg">SİL</button>
                        </div>
                    </div>
                    <div class="flex justify-between items-center mb-6">
                        <div class="text-center w-24"><img src="${hLogo}" class="w-10 h-10 object-contain mx-auto mb-2" onerror="this.src='logos/default.png'"><p class="text-[8px] font-black text-slate-400 uppercase truncate">${m.homeTeam}</p></div>
                        ${scoreUI}
                        <div class="text-center w-24"><img src="${aLogo}" class="w-10 h-10 object-contain mx-auto mb-2" onerror="this.src='logos/default.png'"><p class="text-[8px] font-black text-slate-400 uppercase truncate">${m.awayTeam}</p></div>
                    </div>
                    
                    <div class="bg-black/40 rounded-2xl p-4 border border-white/5">
                        <p class="text-[10px] font-black text-white uppercase text-center mb-3">${m.prediction}</p>
                        <div class="flex items-center justify-between w-full border-t border-white/5 pt-3">
                            <div class="flex items-center gap-2">
                                <img src="${leagueLogoUrl}" class="w-5 h-5 object-contain drop-shadow-md opacity-90" onerror="this.src='logos/default.png'">
                                <span class="text-[8px] text-slate-400 font-black uppercase tracking-widest">${lInfo.name}</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <span class="text-[7px] text-slate-500 font-bold uppercase tracking-widest">Güven:</span>
                                <span class="text-[9px] font-black text-green-400">%${m.confidence || 85}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex gap-2 mt-4">
                        <button onclick="window.db.collection('matches').doc('${m.id}').update({status:'won'})" class="flex-1 py-3 bg-green-600/20 text-green-500 border border-green-500/30 rounded-xl text-[7px] font-black uppercase">KAZANDI YAP</button>
                        <button onclick="window.db.collection('matches').doc('${m.id}').update({status:'lost'})" class="flex-1 py-3 bg-red-600/20 text-red-500 border border-red-500/30 rounded-xl text-[7px] font-black uppercase">KAYBETTİ YAP</button>
                        <button onclick="window.db.collection('matches').doc('${m.id}').update({status:'waiting'})" class="flex-1 py-3 bg-orange-600/20 text-orange-400 border border-orange-500/30 rounded-xl text-[7px] font-black uppercase">BEKLEMEDE YAP</button>
                    </div>
                `;
                if (adminL) adminL.appendChild(card);
            }
        });
        if (window.lucide) window.lucide.createIcons();
    },

    renderUsers: function() {
        var uList = document.getElementById('adminUsersList');
        if (!uList) return;
        uList.innerHTML = '';
        this.usersList.forEach(u => {
            var isVip = u.isVip || u.vip;
            var card = document.createElement('div');
            card.className = "bg-slate-900/60 p-6 rounded-[2.5rem] border border-white/5 mb-6 shadow-2xl relative";
            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-sm font-black text-white uppercase">${u.user || u.username || 'İsimsiz'}</h3>
                        <p class="text-[9px] font-bold text-slate-500 lowercase">${u.email || 'Yok'}</p>
                    </div>
                    <div class="px-3 py-1 rounded-full text-[7px] font-black ${isVip ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.4)]' : 'bg-slate-800 text-slate-500'}">${isVip ? 'PRO' : 'STANDART'}</div>
                </div>
                <div class="grid grid-cols-2 gap-3 mb-6">
                    <div class="bg-black/40 p-3 rounded-2xl border border-white/5">
                        <span class="text-[7px] font-black text-slate-600 uppercase">TELEFON</span>
                        <p class="text-[10px] font-black text-slate-300 truncate">${u.phone || '-'}</p>
                    </div>
                    <div class="bg-black/40 p-3 rounded-2xl border border-white/5">
                        <span class="text-[7px] font-black text-slate-600 uppercase">KULLANIM</span>
                        <p class="text-[10px] font-black text-cyan-400">${u.usageMinutes || 0} DK</p>
                    </div>
                </div>
                <div class="space-y-3">
                    <div class="flex gap-2 bg-black/60 p-2 rounded-2xl border border-white/5">
                        <input type="text" id="pass_${u.id}" value="${u.password || ''}" class="flex-1 bg-transparent px-3 text-[10px] font-black text-slate-400 outline-none" placeholder="Şifre">
                        <button onclick="window.AdminModule.changeUserPassword('${u.id}')" class="bg-white/5 text-white px-4 py-3 rounded-xl text-[8px] font-black uppercase active:bg-white/10 transition-colors">KAYDET</button>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="window.AdminModule.toggleUserVip('${u.id}', ${!isVip})" class="flex-1 py-4 bg-slate-800 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white active:scale-95 transition-transform">${isVip ? 'ÜYELİK İPTAL' : 'KULLANICIYI PRO YAP'}</button>
                        <button onclick="window.db.collection('users').doc('${u.id}').delete()" class="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
                    </div>
                </div>
            `;
            uList.appendChild(card);
        });
        if (window.lucide) window.lucide.createIcons();
    },

    changeUserPassword: function(userId) {
        var n = document.getElementById('pass_' + userId).value;
        if (!n) return this.showSystemMsg("ŞİFRE BOŞ OLAMAZ!");
        window.db.collection("users").doc(userId).update({ password: n, pass: n }).then(() => this.showSystemMsg("ŞİFRE GÜNCELLENDİ"));
    },

    toggleUserVip: function(id, s) { 
        window.db.collection("users").doc(id).update({ isVip: s, vip: s }).then(() => this.showSystemMsg("GÜNCELLENDİ")); 
    },

    renderFeedback: function() {
        var fList = document.getElementById('adminFeedbackList');
        if (!fList) return;
        fList.innerHTML = '';
        this.feedbacks.forEach(f => {
            var card = document.createElement('div');
            card.className = "bg-slate-900/60 p-6 rounded-[2.5rem] border border-white/5 mb-6 relative";
            card.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <span class="text-[9px] font-black text-cyan-400 uppercase">${f.type || 'MESAJ'}</span>
                    <button onclick="window.db.collection('feedbacks').doc('${f.id}').delete()" class="text-red-500 text-[8px] font-black uppercase">SİL</button>
                </div>
                <p class="text-[11px] text-slate-300 mb-2">${f.message}</p>
                <div class="text-[8px] font-black text-slate-500 uppercase">GÖNDEREN: <span class="text-white">${f.username || 'Kullanıcı'}</span></div>
            `;
            fList.appendChild(card);
        });
    },

    // --- MODÜLER API MAÇ EŞLEŞTİRİCİ ---
    openApiMatcher: async function(targetDateOffset = 0) {
        if (!window.ApiModule) {
            return this.showSystemMsg("API MOTORU YÜKLENEMEDİ!");
        }

        var modal = document.getElementById('apiSelectorModal');
        var grid = document.getElementById('apiMatchesGrid');
        if (!modal || !grid) return;
        
        var offset = parseInt(targetDateOffset) || 0;
        
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        
        grid.innerHTML = '<div class="col-span-full text-center py-20"><i data-lucide="loader" class="w-8 h-8 animate-spin mx-auto mb-4 text-cyan-500"></i><p class="text-[10px] text-slate-500 uppercase font-black tracking-widest">Sadece Premium Ligler Aranıyor...</p></div>';
        if (window.lucide) window.lucide.createIcons();

        try {
            const result = await window.ApiModule.getMatchesByDate(offset);
            const matches = result.matches;
            grid.innerHTML = '';

            var dateSelector = document.createElement('div');
            dateSelector.className = "flex justify-between gap-2 mb-4 col-span-full sticky top-0 bg-[#0f172a] pb-2 z-10 border-b border-white/5";
            dateSelector.innerHTML = `
                <button onclick="window.AdminModule.openApiMatcher(-1)" class="flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${offset === -1 ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}">DÜN</button>
                <button onclick="window.AdminModule.openApiMatcher(0)" class="flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${offset === 0 ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}">BUGÜN</button>
                <button onclick="window.AdminModule.openApiMatcher(1)" class="flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${offset === 1 ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}">YARIN</button>
            `;
            grid.appendChild(dateSelector);

            var self = this;
            matches.forEach(function(m) {
                var hs = m.goals.home !== null ? m.goals.home : 0;
                var as = m.goals.away !== null ? m.goals.away : 0;
                var statusText = new Date(m.fixture.date).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
                
                var card = document.createElement('div');
                card.className = "bg-slate-800/40 p-5 rounded-[2rem] border border-white/5 cursor-pointer hover:border-cyan-500/50 active:scale-95 transition-all";
                card.innerHTML = `
                    <div class="flex justify-between items-center mb-3 border-b border-white/5 pb-2">
                        <span class="text-[8px] font-black text-cyan-400 uppercase truncate w-1/2">${m.league.name}</span>
                        <span class="text-[9px] font-black uppercase text-slate-400">${statusText} ${hs}:${as}</span>
                    </div>
                    <div class="flex justify-between items-center gap-2">
                        <span class="text-[10px] font-black text-white uppercase truncate flex-1">${m.teams.home.name}</span>
                        <span class="text-[10px] font-black text-white uppercase truncate flex-1 text-right">${m.teams.away.name}</span>
                    </div>
                `;
                card.onclick = function() {
                    self.selectedApiMatchId = m.fixture.id;
                    document.getElementById('apiMatchText').innerText = "BAĞLANDI: " + m.teams.home.name.substring(0,10).toUpperCase();
                    self.closeApiMatcher();
                };
                grid.appendChild(card);
            });
        } catch (e) {
            grid.innerHTML = '<p class="text-center text-red-500 font-black text-[10px] py-10">API HATASI!</p>';
        }
    },

    closeApiMatcher: function() { 
        document.getElementById('apiSelectorModal').classList.add('hidden'); 
    },

    // --- MODÜLER CANLI SKOR SENKRONİZASYONU ---
    syncLiveScores: async function() {
        var linkedMatches = this.matches.filter(m => m.apiMatchId && m.status === 'waiting');
        if (linkedMatches.length === 0 || !window.ApiModule) return;

        try {
            const liveApiMatches = await window.ApiModule.getLiveMatches();
            linkedMatches.forEach(function(myMatch) {
                var apiMatch = liveApiMatches.find(am => am.fixture.id == myMatch.apiMatchId);
                if (apiMatch) {
                    var s1 = apiMatch.goals.home !== null ? apiMatch.goals.home : 0;
                    var s2 = apiMatch.goals.away !== null ? apiMatch.goals.away : 0;
                    var mnt = apiMatch.fixture.status.elapsed ? apiMatch.fixture.status.elapsed + "'" : "CANLI";
                    window.db.collection("matches").doc(myMatch.id).update({ homeScore: s1, awayScore: s2, matchMinute: mnt });
                }
            });
        } catch (e) { console.log("Skor senkronizasyonu hatası."); }
    },

    // ==========================================
    // --- FCM v1 BİLDİRİM MOTORU (YENİ NESİL) ---
    // ==========================================
    handleFcmKeyFile: function(input) {
        var self = this;
        var file = input.files[0];
        if (!file) return;

        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var json = JSON.parse(e.target.result);
                if (json.project_id && json.private_key && json.client_email) {
                    self.fcmServiceAccount = json;
                    document.getElementById('fcmKeyStatus').innerText = "ANAHTAR YÜKLENDİ: " + json.project_id.toUpperCase();
                    document.getElementById('btnSendNotify').disabled = false;
                    document.getElementById('btnSendNotify').classList.remove('opacity-50', 'cursor-not-allowed');
                    self.showSystemMsg("HİZMET HESABI DOĞRULANDI!");
                } else {
                    self.showSystemMsg("GEÇERSİZ JSON DOSYASI!");
                }
            } catch (err) { self.showSystemMsg("JSON AYRIŞTIRMA HATASI!"); }
        };
        reader.readAsText(file);
    },

    getFcmAccessToken: async function() {
        if (!this.fcmServiceAccount) return null;
        const key = this.fcmServiceAccount;
        const iat = Math.floor(Date.now() / 1000);
        const exp = iat + 3600;

        const header = { alg: "RS256", typ: "JWT" };
        const claim = {
            iss: key.client_email,
            scope: "https://www.googleapis.com/auth/firebase.messaging",
            aud: "https://oauth2.googleapis.com/token",
            exp: exp,
            iat: iat
        };

        try {
            const sHeader = JSON.stringify(header);
            const sPayload = JSON.stringify(claim);
            const sJWT = KJUR.jws.JWS.sign("RS256", sHeader, sPayload, key.private_key);

            const response = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${sJWT}`
            });
            const data = await response.json();
            return data.access_token;
        } catch (err) { return null; }
    },

    sendPushNotification: async function() {
        var title = document.getElementById('notifyTitle').value;
        var body = document.getElementById('notifyBody').value;
        var onlyVip = document.getElementById('notifyOnlyVip').checked;

        if (!title || !body) return this.showSystemMsg("BAŞLIK VE İÇERİK BOŞ OLAMAZ!");
        if (!this.fcmServiceAccount) return this.showSystemMsg("LÜTFEN ÖNCE JSON DOSYASINI SEÇİN!");

        this.showSystemMsg("GÖNDERİM HAZIRLANIYOR...");
        
        try {
            const accessToken = await this.getFcmAccessToken();
            if (!accessToken) return this.showSystemMsg("YETKİ ALINAMADI!");

            var tokens = [];
            const snapshot = await window.db.collection('users').get();
            snapshot.forEach(doc => {
                var u = doc.data();
                if (u.fcmToken) {
                    if (onlyVip && !(u.isVip || u.vip)) return;
                    tokens.push(u.fcmToken);
                }
            });

            if (tokens.length === 0) return this.showSystemMsg("CİHAZ BULUNAMADI!");

            let successCount = 0;
            const projectId = this.fcmServiceAccount.project_id;
            const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

            const promises = tokens.map(token => {
                const message = {
                    message: {
                        token: token,
                        notification: { title: title, body: body },
                        webpush: { notification: { icon: "/logos/default.png", click_action: window.location.origin } }
                    }
                };

                return fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + accessToken },
                    body: JSON.stringify(message)
                }).then(res => { if (res.ok) successCount++; });
            });

            await Promise.all(promises);
            this.showSystemMsg(successCount + " CİHAZA İLETİLDİ!");
            document.getElementById('notifyTitle').value = '';
            document.getElementById('notifyBody').value = '';
        } catch (error) { this.showSystemMsg("HATA OLUŞTU!"); }
    },

    init: function() {
        if (!window.db) return;
        this.renderLeagueDropdown();
        var self = this;
        window.db.collection("matches").onSnapshot(snap => {
            self.matches = []; snap.forEach(doc => { var d = doc.data(); d.id = doc.id; self.matches.push(d); });
            self.renderMatches();
        });
        window.db.collection("users").onSnapshot(snap => {
            self.usersList = []; snap.forEach(doc => { var d = doc.data(); d.id = doc.id; self.usersList.push(d); });
            self.renderUsers();
        });
        window.db.collection("feedbacks").onSnapshot(snap => {
            self.feedbacks = []; snap.forEach(doc => { var d = doc.data(); d.id = doc.id; self.feedbacks.push(d); });
            self.renderFeedback();
        });
        setInterval(() => self.syncLiveScores(), 60000);
    }
};

window.onload = function() { window.AdminModule.init(); };
