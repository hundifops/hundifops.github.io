
document.addEventListener("DOMContentLoaded", () => {

    // Copyright year
    const year = document.getElementById("year");

    if (year) {
        year.textContent = new Date().getFullYear();
    }

    // Game library filters
    const filterButtons = document.querySelectorAll(".filter");
    const gameCards = document.querySelectorAll(".game-card");

    filterButtons.forEach(button => {
        button.addEventListener("click", () => {

            const filter = button.dataset.filter;

            // Update active button
            filterButtons.forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");

            // Filter games
            gameCards.forEach(card => {
                const platforms = card.dataset.platform.split(" ");

                const visible =
                    filter === "all" || platforms.includes(filter);

                card.classList.toggle("hidden", !visible);
            });

        });
    });

});
