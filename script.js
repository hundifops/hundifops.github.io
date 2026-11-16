
document.addEventListener("DOMContentLoaded", async () => {

    // ==================================
    // COPYRIGHT YEAR
    // ==================================

    const year = document.getElementById("year");

    if (year) {
        year.textContent = new Date().getFullYear();
    }


    // ==================================
    // GAME FILTERS
    // ==================================

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


    // ==================================
    // LOAD GAME RANKINGS FROM JSON
    // ==================================

    let gameRankings = {};

    try {

        const response = await fetch("./games.json");

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        gameRankings = await response.json();

        console.log("Game rankings loaded:", gameRankings);

    } catch (error) {

        console.error("Could not load games.json:", error);

        gameRankings = {};

    }


    // ==================================
    // MODAL ELEMENTS
    // ==================================

    const gameModal = document.getElementById("game-modal");
    const modalClose = document.getElementById("modal-close");

    const modalImage = document.getElementById("modal-image");
    const modalTitle = document.getElementById("modal-title");
    const modalPlatform = document.getElementById("modal-platform");
    const modalTier = document.getElementById("modal-tier");
    const modalReview = document.getElementById("modal-review");

    const radarChart = document.getElementById("radar-chart");
    const ratingList = document.getElementById("rating-list");


    // ==================================
    // DEFAULT RANKING
    // ==================================

    const defaultRanking = {
        tier: "Unranked",

        ratings: {
            Gameplay: 0,
            Story: 0,
            Graphics: 0,
            Soundtrack: 0,
            Replayability: 0
        },

        review: "I haven't written a review for this game yet."
    };


    // ==================================
    // CREATE RADAR CHART
    // ==================================

    function createRadarChart(ratings) {

        const categories = Object.keys(ratings);
        const values = Object.values(ratings).map(value => {
            const number = Number(value);

            return Number.isFinite(number)
                ? Math.max(0, Math.min(10, number))
                : 0;
        });

        const centerX = 150;
        const centerY = 130;
        const radius = 82;

        const angleStep = (Math.PI * 2) / categories.length;

        radarChart.innerHTML = "";

        // Create chart grid

        for (let level = 2; level <= 10; level += 2) {

            const points = categories.map((category, index) => {

                const angle = angleStep * index - Math.PI / 2;
                const distance = (radius * level) / 10;

                const x = centerX + Math.cos(angle) * distance;
                const y = centerY + Math.sin(angle) * distance;

                return `${x},${y}`;

            }).join(" ");

            const grid = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "polygon"
            );

            grid.setAttribute("points", points);
            grid.setAttribute("class", "radar-grid");

            radarChart.appendChild(grid);
        }


        // Create chart axes

        categories.forEach((category, index) => {

            const angle = angleStep * index - Math.PI / 2;

            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            const axis = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "line"
            );

            axis.setAttribute("x1", centerX);
            axis.setAttribute("y1", centerY);
            axis.setAttribute("x2", x);
            axis.setAttribute("y2", y);
            axis.setAttribute("class", "radar-axis");

            radarChart.appendChild(axis);


            // Category labels

            const labelRadius = radius + 25;

            const label = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text"
            );

            label.setAttribute(
                "x",
                centerX + Math.cos(angle) * labelRadius
            );

            label.setAttribute(
                "y",
                centerY + Math.sin(angle) * labelRadius
            );

            label.setAttribute("class", "radar-label");
            label.setAttribute("text-anchor", "middle");
            label.setAttribute("dominant-baseline", "middle");
            label.textContent = category;

            radarChart.appendChild(label);

        });


        // Create rating polygon

        const points = values.map((value, index) => {

            const angle = angleStep * index - Math.PI / 2;
            const distance = (radius * value) / 10;

            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;

            return `${x},${y}`;

        }).join(" ");

        const area = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "polygon"
        );

        area.setAttribute("points", points);
        area.setAttribute("class", "radar-area");

        radarChart.appendChild(area);


        // Create rating points

        values.forEach((value, index) => {

            const angle = angleStep * index - Math.PI / 2;
            const distance = (radius * value) / 10;

            const point = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "circle"
            );

            point.setAttribute(
                "cx",
                centerX + Math.cos(angle) * distance
            );

            point.setAttribute(
                "cy",
                centerY + Math.sin(angle) * distance
            );

            point.setAttribute("r", "4");
            point.setAttribute("class", "radar-point");

            radarChart.appendChild(point);

        });

    }


    // ==================================
    // CREATE RATING BARS
    // ==================================

    function createRatingList(ratings) {

        ratingList.innerHTML = "";

        Object.entries(ratings).forEach(([category, value]) => {

            const number = Number(value);

            const score = Number.isFinite(number)
                ? Math.max(0, Math.min(10, number))
                : 0;

            const item = document.createElement("div");
            item.className = "rating-item";

            const header = document.createElement("div");
            header.className = "rating-item-header";

            const categoryName = document.createElement("span");
            categoryName.textContent = category;

            const ratingValue = document.createElement("span");
            ratingValue.className = "rating-value";
            ratingValue.textContent = `${score}/10`;

            header.appendChild(categoryName);
            header.appendChild(ratingValue);

            const track = document.createElement("div");
            track.className = "rating-track";

            const fill = document.createElement("div");
            fill.className = "rating-fill";

            fill.style.width = `${score * 10}%`;

            track.appendChild(fill);

            item.appendChild(header);
            item.appendChild(track);

            ratingList.appendChild(item);

        });

    }


    // ==================================
    // OPEN GAME MODAL
    // ==================================

    function openGameModal(card) {

        const titleElement = card.querySelector(".game-details h3");
        const imageElement = card.querySelector(".cover img");
        const platformElement = card.querySelector(".game-details p");

        if (!titleElement || !imageElement || !gameModal) {
            return;
        }

        const title = titleElement.textContent.trim();

        const ranking = gameRankings[title] || defaultRanking;

        const platform = platformElement
            ? platformElement.textContent
            : "Platform not specified";

        // Game information

        modalImage.src = imageElement.src;
        modalImage.alt = title;

        modalTitle.textContent = title;
        modalPlatform.textContent = platform;

        // Tier

        const tier = ranking.tier || "Unranked";

        modalTier.textContent = tier;

        modalTier.className = "tier-badge";

        const tierClass = {
            S: "tier-s",
            A: "tier-a",
            B: "tier-b",
            C: "tier-c",
            D: "tier-d"
        };

        modalTier.classList.add(
            tierClass[tier.toUpperCase()] || "tier-unranked"
        );

        // Review

        modalReview.textContent =
            ranking.review || "No review has been written yet.";

        // Ratings

        const ratings = ranking.ratings || defaultRanking.ratings;

        createRadarChart(ratings);
        createRatingList(ratings);

        // Show modal

        if (!gameModal.open) {
            gameModal.showModal();
        }

    }


    // ==================================
    // GAME CARD CLICK EVENTS
    // ==================================

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


    // ==================================
    // CLOSE MODAL
    // ==================================

    if (gameModal && modalClose) {

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
