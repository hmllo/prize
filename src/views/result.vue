<template>
    <div class="bg"></div>
    <div class="luckyboy" v-if="list.length" style="width:100%;max-height: 100%;overflow:auto">
        <div v-for="(item,index) in list" :key="index">
            <h3>第{{ index + 1 }}次抽奖幸运名单</h3>
            <ul>
                <template v-for="(e, i) in item.luckyboy" :key="i">
                    <li>
                        <span>{{ e.name }}</span>
                        <span>{{ e.job }}</span>
                    </li>
                </template>
            </ul>
        </div>
	</div>
</template>
<script>
import { reactive, toRefs } from 'vue';
export default {
    setup(){
        let data = JSON.parse(localStorage.getItem('state'));
        const state = reactive(data);
        return{
            ...toRefs(state)
        }
    }
}
</script>