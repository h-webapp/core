import typescript from 'rollup-plugin-typescript';
export default {
	banner:'/* webapp core */',
	entry: 'src/index.ts',
	dest: 'build/js/webapp-core.js',
	moduleName: 'HERE.FRAMEWORK',
	format: 'umd',
	plugins:[
		typescript()
	]
};
