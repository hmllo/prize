<template>
	<div class="bg"></div>
	<div id="container"></div>
	<div class="luckyboy" v-if="list[cur].luckyboy.length">
		<h3>第{{ cur + 1 }}次抽奖幸运名单</h3>
		<ul>
			<template v-for="(e, i) in list[cur].luckyboy" :key="i">
				<li>
					<span>{{ e.name }}</span>
					<span>{{ e.job }}</span>
				</li>
			</template>
		</ul>
	</div>
	<div class="curPerson" v-if="curPerson.name">
		<span class="name">{{ curPerson?.name }}</span>
		<span class="job">{{ curPerson?.job }}</span>
	</div>
	<div class="btn">
		<el-button type="primary" @click="start" v-show="isStart == 0">开始</el-button>
		<el-button type="primary" @click="end" v-show="isStart == 1">结束</el-button>
		<el-button type="primary" @click="next" v-show="isStart == 2">{{
			cur == list.length - 1 ? "查看结果" : "下一奖项"
		}}</el-button>
	</div>
	<div class="set" @click="dialog = true">
		<i class="el-icon-setting"></i>
	</div>
	<el-drawer
		title="设置"
		v-model:visible="dialog"
		direction="rtl"
		ref="drawer"
		size="40%"
		:before-close="cancel"
	>
		<div class="drawer_content">
			<el-form :inline="true" size="small">
				<el-form-item>
					<el-input v-model="number" placeholder="抽奖数量"></el-input>
				</el-form-item>
				<el-form-item>
					<el-button type="primary" @click="addPrize">添 加</el-button>
				</el-form-item>
			</el-form>
			<el-row :gutter="20" class="list_row">
				<el-col :span="6">抽奖顺序</el-col>
				<el-col :span="6">抽奖个数</el-col>
				<el-col :span="12">操作</el-col>
			</el-row>
			<template v-for="(e, i) in list" :key="e.sort">
				<el-row :gutter="20" class="list_row" :class="{ active: cur == i }">
					<el-col :span="6">{{ i + 1 }}.</el-col>
					<el-col :span="6"
						><el-input
							size="small"
							style="width: 50px; margin-right: 5px"
							v-show="e.is_edit"
							v-model="e.number"
							placeholder="抽奖数量"
						></el-input
						><span v-show="!e.is_edit">{{ e.number }}</span
						>个</el-col
					>
					<el-col :span="12">
						<el-button
							size="small"
							type="success"
							icon="el-icon-check"
							circle
							@click="saveRow(i)"
							v-show="e.is_edit"
						></el-button>
						<el-button
							v-show="!e.is_edit"
							size="small"
							type="primary"
							icon="el-icon-edit"
							circle
							@click="editRow(i)"
						></el-button>
						<el-button
							size="small"
							type="danger"
							icon="el-icon-delete"
							circle
							@click="deleteRow(i)"
						></el-button>
					</el-col>
				</el-row>
			</template>
		</div>
		<div class="drawer_footer">
			<el-button size="small" type="primary" icon="el-icon-refresh" @click="reset"
				>重置抽奖</el-button
			>
			<el-button size="small" @click="cancel">关 闭</el-button>
		</div>
	</el-drawer>
</template>
<script>
	import { onMounted, reactive, toRefs, ref } from "vue";
	import Mock from "mockjs";
	import { Message } from "element3";
	import { useRouter } from "vue-router";
	import * as THREE from "../assets/threejs/three.module.js";
	import { TWEEN } from "../assets/threejs/tween.module.min.js";
	import { TrackballControls } from "../assets/threejs/TrackballControls.js";
	import {
		CSS3DRenderer,
		CSS3DSprite,
		CSS3DObject,
	} from "../assets/threejs/CSS3DRenderer.js";
	export default {
		setup() {
			const $router = useRouter();
			let localState = localStorage.getItem("state");
			let stateDefault;

			if (localState) {
				stateDefault = JSON.parse(localState);
			} else {
				let data = Mock.mock({
					"list|120": [
						{
							"id|+1": 1,
							"code|+1": 285018560001,
							name: "@cname",
							"job|1": [
								"技术部",
								"设计部",
								"财务部",
								"运营部",
								"商品部",
								"人力部",
								"市场部",
							],
						},
					],
				});
				stateDefault = {
					cur: 0,
					number: "",
					curPerson: {},
					allPerson: data.list,
					dialog: false,
					timer: null,
					timer3d: null,
					isStart: 0,
					cur3d: 0,
					list: [
						{ number: 30, is_edit: false, luckyboy: [], lastboy: [] },
						{ number: 10, is_edit: false, luckyboy: [], lastboy: [] },
						{ number: 3, is_edit: false, luckyboy: [], lastboy: [] },
						{ number: 1, is_edit: false, luckyboy: [], lastboy: [] },
					],
				};
				localStorage.setItem("state", JSON.stringify(stateDefault));
			}
			const state = reactive(stateDefault);
			const stat = reactive({
				objects: null,
				targets: null,
				render: null,
			});
			let arr3d = ["table", "grid", "sphere", "helix"];

			function addPrize() {
				let number = parseInt(state.number);
				if (isNaN(number)) {
					Message.error("请填写数字");
					return;
				}
				state.list.push({
					number,
					is_edit: false,
					luckyboy: [],
					lastboy: [],
				});
				state.number = "";
				localStorage.setItem("state", JSON.stringify(state));
			}
			function cancel() {
				state.dialog = false;
				localStorage.setItem("state", JSON.stringify(state));
			}
			function editRow(i) {
				state.list[i].is_edit = true;
			}
			function saveRow(i) {
				state.list[i].is_edit = false;
				localStorage.setItem("state", JSON.stringify(state));
			}
			function deleteRow(i) {
				state.list.splice(i, 1);
				localStorage.setItem("state", JSON.stringify(state));
			}
			function reset() {
				state.cur = 0;
				state.cur3d = 0;
				(state.timer = null),
					(state.isStart = 0),
					state.list.map((e) => {
						e.lastboy = [];
						e.luckyboy = [];
					});
				transform(
					stat.targets[arr3d[state.cur3d]],
					2000,
					stat.objects,
					stat.render,
				);
				state.dialog = false;
				localStorage.setItem("state", JSON.stringify(state));
			}
			function start() {
				if (state.timer != null) return;
				state.isStart = 1;
				let all = state.cur ? state.list[state.cur - 1].lastboy : state.allPerson;
				state.timer = setInterval(() => {
					let index = Math.floor(all.length * Math.random());
					state.curPerson = all[index];
				}, 50);
			}
			function end() {
				const { luckyBoy, lastBoy } = luckyboy(state);
				state.list[state.cur].luckyboy = luckyBoy;
				state.list[state.cur].lastboy = lastBoy;
				clearInterval(state.timer);
				state.curPerson = {};
				state.isStart = 2;
				localStorage.setItem("state", JSON.stringify(state));
			}

			function next() {
				state.timer = null;
				state.isStart = 0;
				if (state.cur == state.list.length - 1) {
					localStorage.setItem("state", JSON.stringify(state));
					$router.push({ name: "result" });
					return;
				}
				state.cur += 1;

				let num = 0;
				while (num == 0 || num == state.cur3d) {
					num = Math.floor(Math.random() * 4);
				}
				console.log(num);
				state.cur3d = num;
				transform(
					stat.targets[arr3d[state.cur3d]],
					2000,
					stat.objects,
					stat.render,
				);
				localStorage.setItem("state", JSON.stringify(state));
			}
			onMounted(() => {
				const { objects, targets, render } = background3ds(state);
				stat.objects = objects;
				stat.targets = targets;
				stat.render = render;
				transform(targets[arr3d[state.cur3d]], 2000, objects, render);
			});
			return {
				addPrize,
				cancel,
				editRow,
				deleteRow,
				saveRow,
				reset,
				start,
				end,
				next,
				...toRefs(state),
			};
		},
	};
	function luckyboy(state) {
		let all = state.cur ? state.list[state.cur - 1].lastboy : state.allPerson;
		let allBoy = all.slice(0),
			i = allBoy.length,
			min = i - state.list[state.cur].number;

		let ins = {};
		while (i-- > min) {
			let index = Math.floor((i + 1) * Math.random());
			if (!ins[index]) {
				ins[index] = true;
				[allBoy[index], allBoy[i]] = [allBoy[i], allBoy[index]];
			} else {
				i++;
			}
		}
		let luckyBoy = allBoy.slice(min);
		let lastBoy = allBoy.slice(0, min);
		return {
			luckyBoy,
			lastBoy,
		};
	}
	function background3ds(state) {
		let camera, scene, renderer;
		let controls;

		const objects = [];
		const targets = { table: [], sphere: [], helix: [], grid: [] };

		init();
		animate();

		function init() {
			camera = new THREE.PerspectiveCamera(
				40,
				window.innerWidth / window.innerHeight,
				1,
				10000,
			);
			camera.position.z = 3000;

			scene = new THREE.Scene();

			// table
			for (let i = 0; i < state.allPerson.length; i++) {
				let item = state.allPerson[i];

				const element = document.createElement("div");
				element.className = "element";
				element.style.backgroundColor =
					"rgba(0,127,127," + (Math.random() * 0.5 + 0.25) + ")";

				const symbol = document.createElement("div");
				symbol.className = "symbol";
				symbol.textContent = item.name;
				element.appendChild(symbol);

				const details = document.createElement("div");
				details.className = "details";
				details.innerHTML = item.job;
				element.appendChild(details);

				const objectCSS = new CSS3DObject(element);
				objectCSS.position.x = Math.random() * 4000 - 2000;
				objectCSS.position.y = Math.random() * 4000 - 2000;
				objectCSS.position.z = Math.random() * 4000 - 2000;
				scene.add(objectCSS);

				objects.push(objectCSS);

				const object = new THREE.Object3D();
				object.position.x = (i % 24) * 175 - 2000;
				object.position.y = -((i % 5) * 225) + 600;

				targets.table.push(object);
			}

			// sphere
			const vector = new THREE.Vector3();
			for (let i = 0, l = objects.length; i < l; i++) {
				const phi = Math.acos(-1 + (2 * i) / l);
				const theta = Math.sqrt(l * Math.PI) * phi;
				const object = new THREE.Object3D();
				object.position.setFromSphericalCoords(800, phi, theta);
				vector.copy(object.position).multiplyScalar(2);
				object.lookAt(vector);
				targets.sphere.push(object);
			}

			// helix
			for (let i = 0, l = objects.length; i < l; i++) {
				const theta = i * 0.19 + Math.PI;
				const y = -(i * 15) + 950;
				const object = new THREE.Object3D();
				object.position.setFromCylindricalCoords(2000, theta, y);
				vector.x = object.position.x * 2;
				vector.y = object.position.y;
				vector.z = object.position.z * 2;
				object.lookAt(vector);
				targets.helix.push(object);
			}

			// grid
			for (let i = 0; i < objects.length; i++) {
				const object = new THREE.Object3D();
				object.position.x = (i % 5) * 400 - 800;
				object.position.y = -(Math.floor(i / 5) % 5) * 400 + 800;
				object.position.z = Math.floor(i / 25) * 1000 - 2000;
				targets.grid.push(object);
			}

			//
			renderer = new CSS3DRenderer();
			renderer.setSize(window.innerWidth, window.innerHeight);
			document.getElementById("container").appendChild(renderer.domElement);

			//
			controls = new TrackballControls(camera, renderer.domElement);
			controls.minDistance = 500;
			controls.maxDistance = 6000;
			controls.addEventListener("change", render);
		}
		function animate(e) {
			requestAnimationFrame(animate);
			TWEEN.update();
			controls.update();
			const time = performance.now();
			for (let i = 0, l = objects.length; i < l; i++) {
				const object = objects[i];
				const scale =
					Math.sin((Math.floor(object.position.x) + time) * 0.002) * 0.3 + 1;
				object.scale.set(scale, scale, scale);
			}
			renderer.render(scene, camera);
		}

		function render() {
			renderer.render(scene, camera);
		}

		return {
			objects,
			targets,
			render,
		};
	}
	function transform(targets, duration, objects, render) {
		TWEEN.removeAll();

		for (let i = 0; i < objects.length; i++) {
			const object = objects[i];
			const target = targets[i];

			new TWEEN.Tween(object.position)
				.to(
					{ x: target.position.x, y: target.position.y, z: target.position.z },
					Math.random() * duration + duration,
				)
				.easing(TWEEN.Easing.Exponential.InOut)
				.start();

			new TWEEN.Tween(object.rotation)
				.to(
					{ x: target.rotation.x, y: target.rotation.y, z: target.rotation.z },
					Math.random() * duration + duration,
				)
				.easing(TWEEN.Easing.Exponential.InOut)
				.start();
		}

		new TWEEN.Tween(this)
			.to({}, duration * 2)
			.onUpdate(render)
			.start();
	}
</script>
<style>
	.set {
		position: fixed;
		width: 26px;
		height: 26px;
		top: 10px;
		color: rgb(255, 255, 255);
		font-size: 26px;
		right: 10px;
		line-height: 1;
	}
	.right:hover {
		background-color: rgba(0, 0, 0, 0.3);
	}
	.drawer_footer {
		width: 100%;
		position: absolute;
		bottom: 20px;
		left: 0;
		text-align: right;
		padding-right: 20px;
		box-sizing: border-box;
	}
	.list_row {
		margin: 5px 0;
		line-height: 32px;
	}
	.active {
		color: #f50;
	}
	.bg {
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		background: url(../assets/bg.jpg) center center no-repeat;
		background-size: cover;
	}
	.curPerson {
		background-color: rgba(193, 234, 241, 0.3);
		width: 100px;
		height: 120px;
		line-height: 120px;
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translateY(-50%) translateX(-50%);
		border-radius: 10px;
		color: rgba(255, 255, 255, 0.75);
		background-color: rgba(127, 0, 0, 0.9);
		box-shadow: 0px 0px 12px rgba(255, 0, 0, 0.5);
		border: 1px solid rgba(255, 127, 127, 0.25);
	}
	.btn {
		position: fixed;
		bottom: 50px;
		left: 0;
		text-align: center;
		width: 100%;
	}
	.name {
		display: block;
		font-size: 26px;
	}
	.job {
		position: absolute;
		bottom: 10px;
		left: 0;
		color: #f2f2f2;
		width: 100%;
		text-align: center;
		line-height: 1;
	}
	#container {
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
	}
	.luckyboy {
		display: inline-block;
		position: fixed;
		left: 50%;
		top: 50%;
		transform: translateY(-50%) translateX(-50%);
		/* background: rgba(255, 255, 255, 0.9); */
		border-radius: 4px;
		padding-bottom: 20px;
	}
	.luckyboy h3 {
		font-size: 22px;
		padding: 20px 40px;
		text-align: center;
		margin: 0;
		color: #fff;
	}
	.luckyboy li {
		width: 60px;
		height: 80px;
		display: inline-block;
		margin: 5px;
		border-radius: 4px;
		color: rgba(255, 255, 255, 0.75);
		background-color: rgba(127, 0, 0, 0.6);
		box-shadow: 0px 0px 12px rgba(255, 0, 0, 0.5);
		border: 1px solid rgba(255, 127, 127, 0.25);
		position: relative;
	}
	.luckyboy span {
		display: block;
	}
	.luckyboy span:first-child {
		font-size: 20px;
		margin-top: 15px;
	}
	.luckyboy span:last-child {
		position: absolute;
		width: 100%;
		bottom: 10px;
		font-size: 12px;
	}
	.element {
		width: 150px;
		height: 200px;
		box-shadow: 0px 0px 12px rgba(0, 255, 255, 0.5);
		border: 1px solid rgba(127, 255, 255, 0.25);
		font-family: Helvetica, sans-serif;
		text-align: center;
		line-height: normal;
		cursor: default;
	}

	.element:hover {
		box-shadow: 0px 0px 12px rgba(0, 255, 255, 0.75);
		border: 1px solid rgba(127, 255, 255, 0.75);
	}

	.element .symbol {
		position: absolute;
		top: 50px;
		left: 0px;
		right: 0px;
		font-size: 45px;
		font-weight: bold;
		color: rgba(255, 255, 255, 0.75);
		text-shadow: 0 0 10px rgba(0, 255, 255, 0.95);
	}

	.element .details {
		position: absolute;
		bottom: 15px;
		left: 0px;
		right: 0px;
		font-size: 22px;
		color: rgba(127, 255, 255, 0.75);
	}
</style>
