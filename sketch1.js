let worldData;
let R = 200;
let points = [];
let data;
let maxCylinderHeight = 140;
let UG_types = ["UG", "SHAFT", "TUNNEL", "GALLERY", "MINE", "SHAFT/GR", "SHAFT/LG"];
let yearSlider;  // 直接引用 HTML slider

function preload() {
  worldData = loadJSON("https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json");
  data = loadTable("assets/dataset.csv", "csv", "header");
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  createEasyCam();
  noFill();

  // 获取 yield 最大值
  let yields = data.getColumn("average_yield").map(Number);
  let minYield = min(yields);
  let maxYield = max(yields);

  // 获取 HTML slider
  yearSlider = document.getElementById("yearSlider");

  // 转换经纬度为 3D 坐标
  for (let i = 0; i < data.getRowCount(); i++) {
    let lon = data.getString(i, "longitude");
    let lat = data.getString(i, "latitude");
    let yieldValue = data.getString(i, "average_yield");
    let type = data.getString(i, "type");
    let year = data.getString(i, "year");

    let phi = radians(90 - lat);
    let theta = radians(lon + 180);
    let x = R * sin(phi) * cos(theta);
    let y = R * cos(phi);
    let z = R * sin(phi) * sin(theta);

    let h = map(sqrt(yieldValue), sqrt(min(yields)), sqrt(max(yields)), 5, maxCylinderHeight);

    points.push({ x, y, z, h, type, year });
  }
}

function draw() {
  background(0);
let rotationSpeed = 0.02; // 控制旋转速度
  rotateY(frameCount * rotationSpeed);
  // 绘制实心地球
  push();
  noStroke();
  fill(0, 50, 50);
  sphere(R, 24, 24);
  pop();

  // 绘制地球边界
  stroke(255, 0, 0);
  strokeWeight(0.4);
  drawPoliticalBorders(worldData);

  let currentYear = int(yearSlider.value); // 读取 HTML slider 值

  // 绘制圆柱，只显示年份 <= slider
  for (let p of points) {
    if (p.year > currentYear) continue;

    push();
    let dir = createVector(p.x, p.y, p.z).normalize();
    translate(p.x + dir.x * p.h / 2,
              p.y + dir.y * p.h / 2,
              p.z + dir.z * p.h / 2);

    let rotationAxis = createVector(0, 1, 0).cross(dir);
    let angle = acos(createVector(0, 1, 0).dot(dir));
    if (rotationAxis.mag() > 0.0001) {
      rotate(angle, rotationAxis);
    }

    if (UG_types.includes(p.type)) {
      fill(80, 0, 255);
      stroke(80, 0, 255);
    } else {
      fill(0, 255, 0);
      stroke(0, 255, 0);
    }

    cylinder(0.5, p.h);
    pop();
  }
}

function drawPoliticalBorders(data) {
  for (let feature of data.features) {
    let coords = feature.geometry.coordinates;
    if (feature.geometry.type === "Polygon") {
      drawPolygon(coords);
    } else if (feature.geometry.type === "MultiPolygon") {
      for (let poly of coords) drawPolygon(poly);
    }
  }
}

function drawPolygon(polygon) {
  for (let ring of polygon) {
    beginShape();
    for (let coord of ring) {
      let lon = coord[0];
      let lat = coord[1];
      let phi = radians(90 - lat);
      let theta = radians(lon + 180);
      let x = R * sin(phi) * cos(theta);
      let y = R * cos(phi);
      let z = R * sin(phi) * sin(theta);
      vertex(x, y, z);
    }
    endShape(CLOSE);
  }
}
