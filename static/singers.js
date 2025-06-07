window.addEventListener("DOMContentLoaded", () => {
    let list = document.querySelectorAll(".list");
    let main = document.querySelector(".main");
    let card = document.querySelector("#card-widget");

    let colors = [
        "rgb(212, 165, 160)",
        "rgb(126, 139, 145)",
        "rgb(180, 200, 150)"
    ];

    // 初始化
    document.body.style.backgroundColor = colors[0];
    card.style.backgroundColor = colors[0];

    // 添加动画过渡
    document.body.style.transition = "background-color 0.6s ease";
    card.style.transition = "background-color 0.6s ease";

    main.style.transition = "left 0.5s ease";

    for (let i = 0; i < list.length; i++) {
        list[i].addEventListener("click", () => {
            main.style.left = (i * -100) + "%";
            document.body.style.backgroundColor = colors[i];
            card.style.backgroundColor = colors[i];
        });
    }
});
