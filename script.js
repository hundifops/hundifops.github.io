
document.addEventListener("DOMContentLoaded", async () => {

    /* ==================================
       COPYRIGHT YEAR
    ================================== */

    const year = document.getElementById("year");

    if (year) {
        year.textContent = new Date().getFullYear();
    }


    /* ==================================
       GAME LIBRARY FILTERS
    ================================== */

    const filterButtons = document.querySelectorAll(".filter");
    const gameCards = document.querySelectorAll(".game-card");

    filterButtons.forEach(button => {
        button.addEventListener("click", () => {

            const filter = button.dataset.filter;

            filterButtons.forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");

            gameCards.forEach(card => {
                const platforms = card.dataset.platform.split(" ");

                const visible =
                    filter === "all" || platforms.includes(filter);

                card.classList.toggle("hidden", !visible);
            });

        });
    });


    /* ==================================
       GAME RANKINGS
    ================================== */

    // Tiers: S, A, B, C, D, Unranked
    // Scores: 0–10

    const response = await fetch("games.json");
    const gameRankings = await response.json();


    /* ==================================
       MODAL ELEMENTS
    ================================== */

    const gameModal = document.getElementById("game-modal");
    const modalClose = document.getElementById("modal-close");

    const modalImage = document.getElementById("modal-image");
    const modalTitle = document.getElementById("modal-title");
    const modalPlatform = document.getElementById("modal-platform");
    const modalTier = document.getElementById("modal-tier");
    const modalReview = document.getElementById("modal-review");

    const radarChart = document.getElementById("radar-chart");
    const ratingList = document.getElementById("rating-list");


    /* ==================================
       RADAR CHART
    ================================== */

    function createRadarChart(ratings) {

        const categories = Object.keys(ratings);
        const values = Object.values(ratings).map(value => {
            const score = Number(value);

            return Number.isFinite(score)
                ? Math.max(0, Math.min(10, score))
                : 0;
        });

        const centerX = 150;
        const centerY = 130;
        const radius = 82;
        const labelRadius = 112;

        function getPoint(index, value, maxRadius = radius) {

            const angle =
                (Math.PI * 2 * index / categories.length) -
                Math.PI / 2;

            const distance = (value / 10) * maxRadius;

            return {
                x: centerX + Math.cos(angle) * distance,
                y: centerY + Math.sin(angle) * distance
            };
        }

        let chart = "";

        // Background grid rings

        [2, 4, 6, 8, 10].forEach(level => {

            const points = categories.map((_, index) => {
                const point = getPoint(index, level);
                return `${point.x},${point.y}`;
            }).join(" ");

            chart += `
                <polygon
                    class="radar-grid"
                    points="${points}"
                />
            `;
        });

        // Axis lines and category labels

        categories.forEach((category, index) => {

            const endpoint = getPoint(index, 10);
            const label = getPoint(index, 10, labelRadius);

            let anchor = "middle";

            if (label.x < centerX - 10) anchor = "end";
            if (label.x > centerX + 10) anchor = "start";

            const labelElement = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text"
            );

            labelElement.setAttribute("class", "radar-label");
            labelElement.setAttribute("x", label.x);
            labelElement.setAttribute("y", label.y);
            labelElement.setAttribute("text-anchor", anchor);
            labelElement.setAttribute("dominant-baseline", "middle");

            labelElement.textContent = category;

            chart += `
                <line
                    class="radar-axis"
                    x1="${centerX}"
                    y1="${centerY}"
                    x2="${endpoint.x}"
                    y2="${endpoint.y}"
                />
            `;

            chart += labelElement.outerHTML;
        });

        // Rating shape

        const ratingPoints = values.map((value, index) => {
            const point = getPoint(index, value);
            return `${point.x},${point.y}`;
        }).join(" ");

        chart += `
            <polygon
                class="radar-area"
                points="${ratingPoints}"
            />
        `;

        // Individual rating dots

        values.forEach((value, index) => {

            const point = getPoint(index, value);

            chart += `
                <circle
                    class="radar-point"
                    cx="${point.x}"
                    cy="${point.y}"
                    r="4"
                />
            `;
        });

        radarChart.innerHTML = chart;
    }


    /* ==================================
       RATING BARS
    ================================== */

    function createRatingList(ratings) {

        ratingList.innerHTML = "";

        Object.entries(ratings).forEach(([category, score]) => {

            const numericScore = Number(score);

            const validScore = Number.isFinite(numericScore)
                ? Math.max(0, Math.min(10, numericScore))
                : 0;

            const item = document.createElement("div");
            item.className = "rating-item";

            const header = document.createElement("div");
            header.className = "rating-item-header";

            const name = document.createElement("span");
            name.textContent = category;

            const value = document.createElement("span");
            value.className = "rating-value";
            value.textContent = `${validScore}/10`;

            header.append(name, value);

            const track = document.createElement("div");
            track.className = "rating-track";

            const fill = document.createElement("div");
            fill.className = "rating-fill";
            fill.style.width = `${validScore * 10}%`;

            track.appendChild(fill);
            item.append(header, track);

            ratingList.appendChild(item);
        });
    }


    /* ==================================
       OPEN GAME PROFILE
    ================================== */

    function openGameModal(card) {

        const title = card.querySelector(
            ".game-details h3"
        )?.textContent.trim();

        const image = card.querySelector(".cover img");

        const platform = card.querySelector(
            ".game-details p"
        );

        if (!title || !image || !gameModal) return;

        const ranking = gameRankings[title] || {
            tier: "Unranked",
            ratings: {
                "Gameplay": 0,
                "Story": 0,
                "Graphics": 0,
                "Soundtrack": 0,
                "Replayability": 0
            },
            review: "No review has been added yet."
        };

        const tier = ranking.tier.toUpperCase();

        const tierClasses = {
            "S": "tier-s",
            "A": "tier-a",
            "B": "tier-b",
            "C": "tier-c",
            "D": "tier-d",
            "UNRANKED": "tier-unranked"
        };

        modalImage.src = image.src;
        modalImage.alt = title;

        modalTitle.textContent = title;

        modalPlatform.textContent = platform
            ? platform.textContent
            : "Platform not specified";

        modalTier.textContent = tier === "UNRANKED"
            ? "UNRANKED"
            : `${tier} TIER`;

        modalTier.className =
            "tier-badge " +
            (tierClasses[tier] || "tier-unranked");

        modalReview.textContent = ranking.review;

        createRadarChart(ranking.ratings);
        createRatingList(ranking.ratings);

        if (!gameModal.open) {
            gameModal.showModal();
        }
    }


    /* ==================================
       GAME CARD CLICK EVENTS
    ================================== */

    if (gameModal && modalClose && radarChart && ratingList) {

        gameCards.forEach(card => {

            card.setAttribute("tabindex", "0");
            card.setAttribute("role", "button");

            card.addEventListener("click", () => {
                openGameModal(card);
            });

            card.addEventListener("keydown", event => {

                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openGameModal(card);
                }

            });

        });


        /* ==================================
           CLOSE MODAL
        ================================== */

        modalClose.addEventListener("click", () => {
            gameModal.close();
        });

        gameModal.addEventListener("click", event => {

            if (event.target === gameModal) {
                gameModal.close();
            }

        });

    }

});
